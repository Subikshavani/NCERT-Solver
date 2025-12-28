from optimum.intel import OVModelForCausalLM
from transformers import AutoTokenizer, pipeline
import os

class LocalLLM:
    def __init__(self, model_id="Qwen/Qwen2.5-1.5B-Instruct", model_dir="models/llm_ov"):
        self.model_id = model_id
        self.model_dir = model_dir
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        
        # Check if the OpenVINO model file actually exists
        model_xml = os.path.join(model_dir, "openvino_model.xml")
        
        if not os.path.exists(model_xml):
            print(f"Warning: OpenVINO model file not found at {model_xml}.")
            print("Please run 'python -m src.rag.export_model' to generate it.")
        else:
            print(f"Loading OpenVINO model from {model_dir}...")
            self.model = OVModelForCausalLM.from_pretrained(
                model_dir, 
                library_name="transformers",
                compile=True,
                use_cache=False
            )
            
            self.pipe = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_new_tokens=512,
                temperature=0.7,
                do_sample=True
            )

    def generate(self, prompt):
        if not hasattr(self, 'pipe'):
            return "Error: LLM model not loaded. Please run src/rag/export_model.py first."
            
        result = self.pipe(prompt, max_new_tokens=256)
        generated_text = result[0]['generated_text']
        
        # Clean up: strip the prompt from the result if present
        if generated_text.startswith(prompt):
            generated_text = generated_text[len(prompt):].strip()
            
        return generated_text

if __name__ == "__main__":
    # Example usage
    # llm = LocalLLM()
    # print(llm.generate("What is photosynthesis?"))
    pass
