import os
import argparse
from src.ingestion.vector_store import VectorStoreManager

def main():
    parser = argparse.ArgumentParser(description="Index processed NCERT JSON files into Pinecone.")
    parser.add_argument("--dir", default="data/processed", help="Directory containing processed JSON files")
    parser.add_argument("--index", default=None, help="Pinecone index name")
    args = parser.parse_args()

    # Initialize the VectorStoreManager
    # It will automatically load .env and check for PINECONE_API_KEY
    try:
        manager = VectorStoreManager(index_name=args.index)
        print(f"Starting indexing from: {args.dir}")
        manager.index_processed_files(processed_dir=args.dir)
        print("\nSUCCESS: All files indexed into Pinecone.")
    except Exception as e:
        print(f"\nERROR: Could not complete indexing: {e}")

if __name__ == "__main__":
    main()
