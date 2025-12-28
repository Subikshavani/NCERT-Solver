import os
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from dotenv import load_dotenv

def test_push():
    load_dotenv()
    print("Testing Pinecone push...")
    
    embeddings = HuggingFaceEmbeddings(model_name="paraphrase-multilingual-MiniLM-L12-v2")
    index_name = os.getenv("PINECONE_INDEX_NAME") or "ncert-all"
    
    doc = Document(
        page_content="Testing Pinecone integration with NCERT Solver.",
        metadata={"test": True, "subject": "Test"}
    )
    
    print(f"Upserting to index: {index_name}...")
    try:
        PineconeVectorStore.from_documents(
            documents=[doc],
            embedding=embeddings,
            index_name=index_name,
            namespace="test_namespace"
        )
        print("SUCCESS: Document pushed to Pinecone.")
    except Exception as e:
        print(f"FAILURE: {e}")

if __name__ == "__main__":
    test_push()
