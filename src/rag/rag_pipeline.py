import os
import langdetect
from src.ingestion.vector_store import VectorStoreManager

class RAGPipeline:
    def __init__(self):
        self.vector_store = VectorStoreManager()
        
        # Priority: Ollama -> Gemini -> Local
        ollama_model = os.getenv("OLLAMA_MODEL")
        if ollama_model:
            print(f"Using Ollama ({ollama_model}) for LLM generation.")
            from src.rag.ollama_llm import OllamaLLM
            self.llm = OllamaLLM(model_name=ollama_model)
        else:
            google_api_key = os.getenv("GOOGLE_API_KEY")
            if google_api_key:
                print("Using Gemini API for LLM generation.")
                from src.rag.gemini_llm import GeminiLLM
                self.llm = GeminiLLM()
            else:
                print("GOOGLE_API_KEY not found. Falling back to local OpenVINO LLM.")
                from src.rag.local_llm import LocalLLM
                self.llm = LocalLLM()
        
    def generate_response(self, query, grade=None, subject=None, filename=None):
        """
        Full RAG flow: Retrieve -> Augment -> Generate
        """
        # 1. Detection & Filtering
        try:
            lang = langdetect.detect(query)
        except:
            lang = "en"
            
        filters = {}
        if filename:
            filters["filename"] = filename
        
        # 2. Retrieval
        print(f"Querying Knowledge Base: '{query}'...")
        subject_grade_namespace = None
        if subject and grade:
            subject_grade_namespace = f"{subject}_{grade}".replace(" ", "_")
        
        docs = self.vector_store.search(query, namespace=subject_grade_namespace, k=3, filter=filters if filters else None)
        print(f"Found {len(docs)} relevant context blocks.")
        
        if not docs:
            return {
                "answer": "I am sorry, but I don't have information about that in my NCERT knowledge base.",
                "citations": []
            }
            
        context = "\n---\n".join([doc.page_content for doc in docs])
        
        # 3. Augmentation (Prompt Engineering)
        prompt = self._build_prompt(query, context, lang)
        
        # 4. Generation
        print("Brain is thinking (Generating response)...")
        response_text = self.llm.generate(prompt)
        print("Response generated.")
        
        # 5. Citations
        citations = []
        for doc in docs:
            citations.append({
                "source": doc.metadata.get("filename", "Unknown"),
                "page": doc.metadata.get("page", "?"),
                "grade": doc.metadata.get("grade", "?"),
                "subject": doc.metadata.get("subject", "?")
            })
            
        return {
            "answer": response_text,
            "citations": citations,
            "detected_language": lang
        }

    def _build_prompt(self, query, context, lang):
        if lang == "hi":
            return f"""आप एक सहायक एआई हैं। नीचे दिए गए संदर्भ का उपयोग करके छात्र के प्रश्न का उत्तर दें। 
यदि उत्तर संदर्भ में नहीं है, तो कहें "मुझे नहीं पता"।

संदर्भ:
{context}

प्रश्न: {query}
उत्तर:"""
        else:
            return f"""You are a helpful AI assistant for students. Answer the student's question using only the provided context. 
If the answer is not in the context, say "I don't know". 
Always provide a clear and simple explanation suitable for students.

Context:
{context}

Question: {query}
Answer:"""

if __name__ == "__main__":
    # Example usage
    # pipeline = RAGPipeline()
    # print(pipeline.generate_response("What is the capital of India?"))
    pass
