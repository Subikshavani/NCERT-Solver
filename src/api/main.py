from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
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

# Lazy load heavy modules only when needed
pipeline = None
ingestor = None

def get_pipeline():
    global pipeline
    if pipeline is None:
        from src.rag.rag_pipeline import RAGPipeline
        pipeline = RAGPipeline()
    return pipeline

def get_ingestor():
    global ingestor
    if ingestor is None:
        from src.ingestion.ingest_books import DataIngestor
        ingestor = DataIngestor()
    return ingestor

class QueryRequest(BaseModel):
    query: str
    grade: Optional[str] = None
    subject: Optional[str] = None
    filename: Optional[str] = None
    conversation_id: Optional[str] = None
    language: Optional[str] = "en"  # Language preference: en, hi, ta, te, ka, ml, etc.

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
        pipe = get_pipeline()
        response = pipe.generate_response(
            query=request.query,
            grade=request.grade,
            subject=request.subject,
            filename=request.filename,
            language=request.language
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
        ing = get_ingestor()
        ing.ingest_file(file_path)
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
    Dynamically scan data/classX directories for PDFs and return library structure.
    Organizes by subject and grade.
    """
    library = {}
    data_dir = "data"
    
    if not os.path.exists(data_dir):
        return {"subjects": []}
    
    # Map directory names to subject names
    subject_mapping = {
        "English": "English",
        "english": "English",
        "EVS": "Science",
        "evs": "Science",
        "Science": "Science",
        "science": "Science",
        "Maths": "Mathematics",
        "maths": "Mathematics",
        "Mathematics": "Mathematics",
        "mathematics": "Mathematics",
        "Hindi": "Hindi",
        "hindi": "Hindi",
        "Social": "Social Science",
        "social": "Social Science",
        "History": "Social Science",
        "history": "Social Science",
        "Geography": "Social Science",
        "geography": "Social Science"
    }
    
    # Scan classX directories
    for class_dir in sorted(os.listdir(data_dir)):
        class_path = os.path.join(data_dir, class_dir)
        if not os.path.isdir(class_path) or not class_dir.startswith("class"):
            continue
        
        try:
            grade = class_dir.replace("class", "")
            
            # Scan subject subdirectories
            for subject_dir in os.listdir(class_path):
                subject_path = os.path.join(class_path, subject_dir)
                if not os.path.isdir(subject_path):
                    continue
                
                # Map folder name to standardized subject
                subject = subject_mapping.get(subject_dir, subject_dir)
                
                # Recursively scan for PDF files in subject directory (handles extra subfolders)
                for root, _, files in os.walk(subject_path):
                    for pdf_file in files:
                        if pdf_file.lower().endswith(".pdf"):
                            # Determine subject label: prefer deeper folder name if present (e.g., class5/english/maths)
                            if os.path.abspath(root) != os.path.abspath(subject_path):
                                subfolder = os.path.basename(root)
                                subj_label = subject_mapping.get(subfolder, subfolder)
                            else:
                                subj_label = subject

                            if subj_label not in library:
                                library[subj_label] = []

                            # Create chapter entry. Use relative path under class folder to make id unique
                            rel_dir = os.path.relpath(root, class_path).replace("\\", "_")
                            id_part = f"{class_dir}_{subject_dir}_{rel_dir}_{pdf_file}" if rel_dir not in (".", "") else f"{class_dir}_{subject_dir}_{pdf_file}"
                            title = os.path.splitext(pdf_file)[0].replace("_", " ").title()
                            library[subj_label].append({
                                "id": id_part,
                                "title": title,
                                "grade": grade,
                                "filename": pdf_file,
                                "subject": subj_label,
                                "path": os.path.join(root, pdf_file)
                            })
        except Exception as e:
            print(f"Error processing {class_dir}: {e}")
    
    # Convert to formatted output
    formatted_library = []
    for subject in sorted(library.keys()):
        formatted_library.append({
            "subject": subject,
            "chapters": sorted(library[subject], key=lambda x: (x["grade"], x["title"]))
        })
    
    return {"subjects": formatted_library}

@app.post("/assessment")
async def generate_assessment(request: QueryRequest):
    """
    Generates flashcards and quizzes based on a topic or subject context.
    """
    try:
        pipe = get_pipeline()
        # 1. Determine Namespace for retrieval
        namespace = None
        if request.subject and request.grade:
            namespace = f"{request.subject}_{request.grade}".replace(" ", "_")
        
        # 2. Retrieve context
        filters = {"filename": request.filename} if request.filename else None
        docs = pipe.vector_store.search(request.query, namespace=namespace, k=8, filter=filters)
        
        if not docs:
            # Fallback: if no specific query matches, just get general subject context
            docs = pipe.vector_store.search(request.subject or "NCERT", namespace=namespace, k=8, filter=filters)
            
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
        raw_response = pipe.llm.generate(prompt)
        
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
        pipe = get_pipeline()
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
        
        raw_response = pipe.llm.generate(prompt)
        
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
