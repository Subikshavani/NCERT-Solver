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
    Generates flashcards and quizzes based on a topic (from RAG context).
    """
    try:
        # 1. Retrieve context for the topic
        docs = pipeline.vector_store.search(request.query, k=5, filter={"filename": request.filename} if request.filename else None)
        if not docs:
            raise HTTPException(status_code=404, detail="No content found for this topic to generate assessment.")
            
        context = "\n---\n".join([doc.page_content for doc in docs])
        
        # 2. Generate Flashcards/Quiz (Simple prompt for now)
        prompt = f"""Based on the following NCERT context, generate 3 flashcards (Question/Answer) and 1 multiple choice question (Question, 4 Options, Correct Answer).
Output format: JSON with 'flashcards' and 'quiz' keys.

Context:
{context}
"""
        raw_response = pipeline.llm.generate(prompt)
        # In a real scenario, we'd parse this JSON. For now, returning a mock structure 
        # that mimics what the LLM should produce.
        return {
            "topic": request.query,
            "flashcards": [
                {"q": f"What is the main idea of {request.query}?", "a": "As per NCERT, it is..."},
                {"q": "How does it impact students?", "a": "It helps in understanding..."},
                {"q": "Key term associated?", "a": "Found in Chapter 4."}
            ],
            "quiz": {
                "q": f"According to the text, which of these is true about {request.query}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct": "Option A"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
