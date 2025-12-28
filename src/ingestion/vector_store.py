import os
import json
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from dotenv import load_dotenv

class VectorStoreManager:
    def __init__(self, index_name=None, embedding_model="paraphrase-multilingual-MiniLM-L12-v2"):
        load_dotenv()
        # Prioritize constructor arg, then .env, then default
        self.index_name = index_name or os.getenv("PINECONE_INDEX_NAME") or "ncert-all"
        self.api_key = os.getenv("PINECONE_API_KEY")
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY environment variable is not set")
        
        self.pc = Pinecone(api_key=self.api_key)
        self.embeddings = HuggingFaceEmbeddings(model_name=embedding_model)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        self.vector_db = None
        
        # Ensure index exists and has correct dimensions
        target_dimension = 384 # MultiLM-L12-v2
        
        try:
            indexes = self.pc.list_indexes()
            existing_index_names = [idx.name for idx in indexes]
            
            if self.index_name in existing_index_names:
                # Check dimensions
                desc = self.pc.describe_index(self.index_name)
                if desc.dimension != target_dimension:
                    print(f"Dimension mismatch (Index: {desc.dimension}, Model: {target_dimension}). Re-creating index...")
                    self.pc.delete_index(self.index_name)
                    existing_index_names.remove(self.index_name)
            
            if self.index_name not in existing_index_names:
                print(f"Creating Pinecone index: {self.index_name} with dimension {target_dimension}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=target_dimension,
                    metric="cosine",
                    spec=ServerlessSpec(cloud="aws", region="us-east-1")
                )
        except Exception as e:
            print(f"Warning/Error checking Pinecone index: {e}")
        
        print(f"Vector Store Manager initialized with index: {self.index_name}")

    def index_processed_files(self, processed_dir="data/processed"):
        """
        Loads processed JSON files and indexes them into namespaces based on subject and grade.
        """
        print(f"Index name: {self.index_name}")
        for file in os.listdir(processed_dir):
            if file.endswith(".json"):
                file_path = os.path.join(processed_dir, file)
                print(f"\nProcessing file: {file}")
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        metadata = data["metadata"]
                        subject = metadata.get("subject", "General")
                        grade = metadata.get("grade", "General")
                        namespace = f"{subject}_{grade}".replace(" ", "_")
                        
                        documents = []
                        for page in data["pages"]:
                            doc_metadata = metadata.copy()
                            doc_metadata["page"] = page["page_number"]
                            doc_metadata["extraction_type"] = page["type"]
                            
                            doc = Document(
                                page_content=page["content"],
                                metadata=doc_metadata
                            )
                            documents.append(doc)
    
                        if not documents:
                            print(f"  Warning: No pages found in {file}")
                            continue
    
                        print(f"  Documents created: {len(documents)}")
                        # Split documents into chunks
                        chunks = self.text_splitter.split_documents(documents)
                        print(f"  Chunks generated: {len(chunks)} (Namespace: {namespace})")
                        
                        if not chunks:
                             print(f"  Warning: No chunks generated for {file}")
                             continue
    
                        # Upsert to Pinecone
                        print(f"  Starting upsert to Pinecone...")
                        PineconeVectorStore.from_documents(
                            documents=chunks,
                            embedding=self.embeddings,
                            index_name=self.index_name,
                            namespace=namespace
                        )
                        print(f"  Successfully upserted {len(chunks)} chunks.")
                except Exception as e:
                    print(f"  ERROR processing {file}: {e}")

        print(f"Indexing complete for all files in {processed_dir}")

    def search(self, query, namespace=None, k=3, filter=None):
        """
        Search for relevant chunks. If namespace is None, search across all available namespaces.
        """
        if namespace:
            self.vector_db = PineconeVectorStore(
                index_name=self.index_name,
                embedding=self.embeddings,
                namespace=namespace
            )
            return self.vector_db.similarity_search(query, k=k, filter=filter)
        else:
            # Global search across all namespaces
            print("  Starting global search across all namespaces...")
            try:
                index = self.pc.Index(self.index_name)
                stats = index.describe_index_stats()
                namespaces = list(stats.namespaces.keys())
                print(f"  Found namespaces: {namespaces}")
                
                all_results = []
                for ns in namespaces:
                    print(f"    Searching namespace: {ns}...")
                    vdb = PineconeVectorStore(
                        index_name=self.index_name,
                        embedding=self.embeddings,
                        namespace=ns
                    )
                    # We get slightly more results per namespace to re-rank
                    results = vdb.similarity_search_with_score(query, k=k, filter=filter)
                    print(f"    Found {len(results)} results in {ns}")
                    for doc, score in results:
                        all_results.append((doc, score))
                
                # Sort by score descending and take top k
                all_results.sort(key=lambda x: x[1], reverse=True)
                print(f"  Global search finished. Total candidates: {len(all_results)}")
                return [doc for doc, score in all_results[:k]]
                
            except Exception as e:
                print(f"Error in global search: {e}")
                return []

if __name__ == "__main__":
    pass
