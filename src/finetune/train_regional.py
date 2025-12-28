from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import load_dataset
import torch

class RegionalFinetuner:
    def __init__(self, model_id="meta-llama/Llama-3.2-1B-Instruct"):
        self.model_id = model_id
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
        self.model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto"
        )

    def train(self, dataset_path, output_dir="./models/regional_finetuned"):
        """
        Expects a JSONL dataset with 'text' or 'instruction'/'response' fields.
        """
        dataset = load_dataset("json", data_files=dataset_path, split="train")
        
        def tokenize_function(examples):
            return self.tokenizer(examples["text"], truncation=True, padding="max_length", max_length=512)

        tokenized_datasets = dataset.map(tokenize_function, batched=True, remove_columns=dataset.column_names)

        training_args = TrainingArguments(
            output_dir=output_dir,
            per_device_train_batch_size=4,
            gradient_accumulation_steps=4,
            learning_rate=2e-5,
            num_train_epochs=3,
            logging_steps=10,
            save_strategy="epoch",
            push_to_hub=False,
            # For low-end laptops, we might need these:
            fp16=torch.cuda.is_available(),
            # use_ipex=True # Uncomment for Intel CPU optimization during training if using IPEX
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=tokenized_datasets,
            data_collator=DataCollatorForLanguageModeling(tokenizer=self.tokenizer, mlm=False)
        )

        print("Starting training...")
        trainer.train()
        print(f"Training complete. Model saved to {output_dir}")
        self.model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)

if __name__ == "__main__":
    # Example:
    # finetuner = RegionalFinetuner()
    # finetuner.train("data/processed/regional_dataset.jsonl")
    pass
