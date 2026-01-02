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
                print("GOOGLE_API_KEY not found. Attempting to use local OpenVINO LLM.")
                try:
                    from src.rag.local_llm import LocalLLM
                    self.llm = LocalLLM()
                except Exception as e:
                    print(f"Local LLM not available: {e}")
                    # Fallback lightweight LLM: extracts 4-line answer in requested language
                    class SimpleLLM:
                        def generate(self, prompt, language='en'):
                            # Extract 4-line answer and optionally translate
                            try:
                                # Extract context after 'Context:'
                                parts = prompt.split('Context:')
                                if len(parts) > 1:
                                    ctx = parts[1]
                                else:
                                    ctx = prompt
                                
                                # Collect non-empty sentences
                                sentences = []
                                for line in ctx.split('\n'):
                                    s = line.strip()
                                    if s and len(s) > 15 and not s.startswith('---'):
                                        sentences.append(s)
                                
                                # Return first 4 sentences
                                if sentences:
                                    answer = ' '.join(sentences[:4])
                                    if len(answer) > 400:
                                        answer = answer[:400].rsplit(' ', 1)[0] + '.'
                                    
                                    # Attempt translation if language is not English
                                    if language and language != 'en':
                                        try:
                                            from translate import Translator
                                            translator = Translator(from_lang='en', to_lang=language)
                                            answer = translator.translate(answer)
                                        except Exception as e:
                                            # If translation fails, return English with note
                                            answer = answer + "\n[Note: Response in " + language + " unavailable. English provided above.]"
                                    
                                    return answer
                            except Exception:
                                pass
                            return "I don't have information about that in my NCERT knowledge base."

                    self.llm = SimpleLLM()
        
    def generate_response(self, query, grade=None, subject=None, filename=None, language=None):
        """
        Full RAG flow: Retrieve -> Augment -> Generate
        """
        # 1. Language preference (use provided language or auto-detect)
        if not language:
            try:
                language = langdetect.detect(query)
            except:
                language = "en"
        
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
        prompt = self._build_prompt(query, context, language)
        
        # 4. Generation
        print("Brain is thinking (Generating response)...")
        response_text = self.llm.generate(prompt, language=language)
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
            "response_language": language
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
