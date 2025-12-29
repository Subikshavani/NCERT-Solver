import requests
import json
import os

class OllamaLLM:
    def __init__(self, model_name="qwen2.5"):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/api/generate")
        self.model_name = model_name

    def generate(self, prompt):
        try:
            payload = {
                "model": self.model_name,
                "prompt": prompt,
                "stream": False
            }
            response = requests.post(self.base_url, json=payload)
            response.raise_for_status()
            result = response.json()
            return result.get("response", "Error: No response from Ollama")
        except Exception as e:
            return f"Error connecting to Ollama: {e}. Make sure Ollama is running and the model '{self.model_name}' is pulled."

if __name__ == "__main__":
    # Test
    # llm = OllamaLLM()
    # print(llm.generate("Hello!"))
    pass
