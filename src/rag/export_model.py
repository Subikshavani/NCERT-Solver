from optimum.intel import OVModelForCausalLM
from transformers import AutoTokenizer
import os

def export_model(model_id="Qwen/Qwen2.5-1.5B-Instruct", save_dir="models/llm_ov"):
    print(f"Exporting {model_id} to OpenVINO format...")
    
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
        
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    print("Saving tokenizer...")
    tokenizer.save_pretrained(save_dir)
    
    print("Exporting model to OpenVINO (this will download ~3GB and convert it)...")
    # Export to OpenVINO
    model = OVModelForCausalLM.from_pretrained(
        model_id, 
        export=True, 
        library_name="transformers", 
        task="text-generation",
        use_cache=False
    )
    print("Saving OpenVINO model...")
    model.save_pretrained(save_dir)
    
    print(f"Model successfully exported to {save_dir}")

if __name__ == "__main__":
    # Note: Running this will download the model (~2GB) and convert it.
    # Ensure you have your Hugging Face token set if the model is gated.
    export_model()
