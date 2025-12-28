from src.ingestion.vector_store import VectorStoreManager
import os
from dotenv import load_dotenv

def test_retrieval():
    load_dotenv()
    manager = VectorStoreManager()
    
    query = "What is a chemical reaction?"
    
    # Test 1: Search without namespace (should fail/return nothing)
    print(f"\n--- Testing Search: '{query}' (No Namespace) ---")
    docs_no_ns = manager.search(query, namespace=None, k=3)
    print(f"Results found: {len(docs_no_ns)}")
    
    # Test 2: Search with 'Science_10' namespace (should succeed)
    print(f"\n--- Testing Search: '{query}' (Namespace: Science_10) ---")
    docs_sci = manager.search(query, namespace="Science_10", k=3)
    print(f"Results found: {len(docs_sci)}")
    if docs_sci:
        for i, doc in enumerate(docs_sci):
            print(f"[{i+1}] Source: {doc.metadata.get('filename')}, Page: {doc.metadata.get('page')}")
            print(f"    Content snippet: {doc.page_content[:200]}...")

    # Test 3: Search with 'Maths_10' namespace (should return math stuff or low score)
    query_math = "What is a quadratic equation?"
    print(f"\n--- Testing Search: '{query_math}' (Namespace: Maths_10) ---")
    docs_math = manager.search(query_math, namespace="Maths_10", k=3)
    print(f"Results found: {len(docs_math)}")
    if docs_math:
        for i, doc in enumerate(docs_math):
            print(f"[{i+1}] Source: {doc.metadata.get('filename')}, Page: {doc.metadata.get('page')}")

if __name__ == "__main__":
    test_retrieval()
