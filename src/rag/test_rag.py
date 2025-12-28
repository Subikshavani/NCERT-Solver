from src.rag.rag_pipeline import RAGPipeline
import argparse

def main():
    parser = argparse.ArgumentParser(description="Test the NCERT Solver RAG Pipeline.")
    parser.add_argument("--query", type=str, required=True, help="Question to ask the AI")
    parser.add_argument("--grade", type=str, default="10", help="Grade level")
    parser.add_argument("--subject", type=str, default="Science", help="Subject area")
    args = parser.parse_args()

    print(f"Initializing RAG Pipeline...")
    try:
        pipeline = RAGPipeline()
        print(f"\nUser: {args.query}")
        print(f"Namespace: {args.subject}_{args.grade}\n")
        
        result = pipeline.generate_response(args.query, grade=args.grade, subject=args.subject)
        
        print(f"Language: {result['detected_language']}")
        print(f"AI: {result['answer']}")
        print("\nCitations:")
        for цит in result['citations']:
            print(f"- {цит['source']} (Page {цит['page']})")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    main()
