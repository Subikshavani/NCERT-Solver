import os
from pinecone import Pinecone
from dotenv import load_dotenv

def check_pinecone():
    load_dotenv()
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME") or "ncert-all"
    
    if not api_key:
        print("ERROR: PINECONE_API_KEY not found in .env")
        return

    print(f"Connecting to Pinecone with index: {index_name}")
    pc = Pinecone(api_key=api_key)
    
    try:
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        print("\n--- Index Stats ---")
        print(f"Total Vectors: {stats.total_vector_count}")
        print(f"Namespaces: {stats.namespaces}")
        
    except Exception as e:
        print(f"ERROR: Could not connect to index: {e}")

if __name__ == "__main__":
    check_pinecone()
