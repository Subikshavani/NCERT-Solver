import os
import json
import argparse
from src.ocr.ocr_engine import OCREngine

class DataIngestor:
    def __init__(self, raw_dir="data/raw", processed_dir="data/processed"):
        self.raw_dir = raw_dir
        self.processed_dir = processed_dir
        self.ocr_engine = OCREngine()
        
        if not os.path.exists(self.processed_dir):
            os.makedirs(self.processed_dir)

    def ingest_all(self):
        """
        Process all PDFs in the raw directory.
        Expects a structure like: data/raw/Grade_10/Science/book.pdf
        """
        for root, dirs, files in os.walk(self.raw_dir):
            for file in files:
                if file.endswith(".pdf"):
                    raw_path = os.path.join(root, file)
                    self.ingest_file(raw_path)

    def ingest_file(self, file_path):
        """
        Extract text from a single file and save metadata.
        """
        print(f"\n--- Starting Ingestion: {file_path} ---")
        
        # Normalize path separators
        clean_path = file_path.replace("\\", "/")
        rel_path = os.path.relpath(file_path, self.raw_dir).replace("\\", "/")
        parts = rel_path.split("/")
        
        # Dynamic metadata extraction based on folder structure
        # Expected: data/raw/10/Science/ch1.pdf -> parts = ['10', 'Science', 'ch1.pdf']
        metadata = {
            "source": file_path,
            "filename": parts[-1],
            "grade": parts[0] if len(parts) > 1 else "Unknown",
            "subject": parts[1] if len(parts) > 2 else "Unknown"
        }
        
        # Fallback if structure is shallow: data/raw/Science/ch1.pdf
        if metadata["grade"].isalpha() and metadata["subject"] == "Unknown":
             metadata["subject"] = metadata["grade"]
             metadata["grade"] = "10" # Default fallback
        
        print(f"Metadata identified: Grade {metadata['grade']}, Subject {metadata['subject']}")

        try:
            pages = self.ocr_engine.extract_text_from_pdf(file_path)
            
            # Save processed data
            output_filename = f"{metadata['grade']}_{metadata['subject']}_{metadata['filename']}.json".replace(" ", "_")
            output_path = os.path.join(self.processed_dir, output_filename)
            
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump({"metadata": metadata, "pages": pages}, f, indent=4, ensure_ascii=False)
            
            print(f"DONE: Successfully saved {len(pages)} pages to {output_path}")
        except Exception as e:
            print(f"ABORTED: Error processing {file_path}: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest NCERT books.")
    parser.add_argument("--file", help="Path to a specific file to ingest")
    args = parser.parse_args()

    ingestor = DataIngestor()
    if args.file:
        ingestor.ingest_file(args.file)
    else:
        ingestor.ingest_all()
