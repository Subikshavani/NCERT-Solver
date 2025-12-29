from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from src.rag.rag_pipeline import RAGPipeline
from src.ingestion.ingest_books import DataIngestor
import os
import shutil
import json

app = FastAPI(title="NCERT Solver API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Pipeline (Note: This might be heavy for startup)
pipeline = RAGPipeline()
ingestor = DataIngestor()

class QueryRequest(BaseModel):
    query: str
    grade: Optional[str] = None
    subject: Optional[str] = None
    filename: Optional[str] = None
    conversation_id: Optional[str] = None

class FeedbackRequest(BaseModel):
    query: str
    answer: str
    rating: int  # 1 for good, 0 for bad
    comments: Optional[str] = None

class MissionRequest(BaseModel):
    displayName: str
    readiness: float
    subjects_mastery: dict
    recent_activity: List[dict]
    persona: str

@app.get("/")
async def root():
    return {"message": "NCERT Solver API is running"}

@app.post("/chat")
async def chat(request: QueryRequest):
    try:
        response = pipeline.generate_response(
            query=request.query,
            grade=request.grade,
            subject=request.subject,
            filename=request.filename
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    grade: str = Form(...),
    subject: str = Form(...)
):
    # Save file to data/raw
    save_dir = os.path.join("data/raw", grade, subject)
    os.makedirs(save_dir, exist_ok=True)
    
    file_path = os.path.join(save_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Trigger ingestion
    try:
        ingestor.ingest_file(file_path)
        return {"status": "success", "message": f"File {file.filename} uploaded and indexed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.post("/feedback")
async def feedback(request: FeedbackRequest):
    # Log feedback to a file or database
    feedback_path = "data/feedback.jsonl"
    with open(feedback_path, "a", encoding="utf-8") as f:
        f.write(request.json() + "\n")
    return {"status": "success"}

@app.get("/library")
async def get_library():
    """
    Returns a list of all processed chapters/books using their PDF filenames as titles.
    """
    processed_dir = "data/processed"
    if not os.path.exists(processed_dir):
        return {"subjects": []}
    
    library = {}
    
    for filename in os.listdir(processed_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(processed_dir, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                
                metadata = data.get("metadata", {})
                subject = metadata.get("subject", "General")
                grade = metadata.get("grade", "10")
                
                # Use the original PDF filename from metadata as the title
                title = metadata.get("filename", filename)

                if subject not in library:
                    library[subject] = []
                
                library[subject].append({
                    "id": filename,
                    "title": title,
                    "grade": grade,
                    "filename": metadata.get("filename")
                })
            except Exception as e:
                print(f"Error processing {filename}: {e}")
                
    formatted_library = []
    for subject, chapters in library.items():
        formatted_library.append({
            "subject": subject,
            "chapters": chapters
        })
        
    return {"subjects": formatted_library}

@app.post("/assessment")
async def generate_assessment(request: QueryRequest):
    """
    Generates flashcards and quizzes based on a topic or subject context.
    """
    try:
        # 1. Determine Namespace for retrieval
        namespace = None
        if request.subject and request.grade:
            namespace = f"{request.subject}_{request.grade}".replace(" ", "_")
        
        # 2. Retrieve context
        filters = {"filename": request.filename} if request.filename else None
        docs = pipeline.vector_store.search(request.query, namespace=namespace, k=8, filter=filters)
        
        if not docs:
            # Fallback: if no specific query matches, just get general subject context
            docs = pipeline.vector_store.search(request.subject or "NCERT", namespace=namespace, k=8, filter=filters)
            
        if not docs:
            raise HTTPException(status_code=404, detail="No content found to generate assessment.")
            
        context = "\n---\n".join([doc.page_content for doc in docs])
        
        # 3. Generate structured assessment
        prompt = f"""You are an educational assessment expert for NCERT curriculum. 
Using the context below, generate high-quality study materials for a student.

Context:
{context}

Output strictly in JSON format with the following structure:
{{
  "topic": "The main topic name",
  "flashcards": [
    {{"q": "Question/Term", "a": "Concise answer/definition"}},
    ... (at least 4)
  ],
  "quiz": [
    {{
      "q": "Multiple choice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Exact string of the correct option"
    }},
    ... (at least 3)
  ]
}}

Ensure questions are diverse and cover key concepts from the context.
"""
        raw_response = pipeline.llm.generate(prompt)
        
        # Clean response if LLM adds markdown blocks
        clean_json = raw_response.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif clean_json.startswith("```"):
            clean_json = clean_json.split("```")[1].split("```")[0].strip()
            
        return json.loads(clean_json)
    except Exception as e:
        print(f"Assessment generation error: {e}")
        # Return a fallback structure if parsing fails
        return {
            "topic": request.subject or "Study Session",
            "flashcards": [
                {"q": "Error generating flashcards", "a": "Please try a more specific topic."}
            ],
            "quiz": []
        }
@app.post("/mission")
async def generate_mission(request: MissionRequest):
    """
    Analyzes student data via LLM to generate a personalized daily mission.
    """
    try:
        # Construct the context for the LLM
        stats_context = f"""
        Student: {request.displayName}
        Persona: {request.persona}
        Current Readiness: {request.readiness}%
        Subject Mastery: {json.dumps(request.subjects_mastery)}
        Recent Activity: {json.dumps(request.recent_activity[:3])}
        """

        prompt = f"""You are an expert academic coach. Based on the student stats below, generate ONE high-impact 'Daily Mission' to help them improve.
        
        {stats_context}
        
        Requirements:
        1. Be specific (mention a subject or concept based on their low mastery).
        2. Be encouraging but direct.
        3. Output strictly in JSON format:
        {{
          "mission_title": "Short catchy title",
          "description": "Specific action to take",
          "target_subject": "Science/Math/etc",
          "reward_points": 50
        }}
        """
        
        raw_response = pipeline.llm.generate(prompt)
        
        # Clean response
        clean_json = raw_response.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json.split("```json")[1].split("```")[0].strip()
        elif clean_json.startswith("```"):
            clean_json = clean_json.split("```")[1].split("```")[0].strip()
            
        return json.loads(clean_json)
    except Exception as e:
        print(f"Mission generation error: {e}")
        return {
            "mission_title": "Concept Deep Dive",
            "description": "Re-examine your last studied chapter to solidify understanding.",
            "target_subject": "General",
            "reward_points": 20
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
