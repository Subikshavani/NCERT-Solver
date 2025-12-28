import json
import random
import os

class DatasetGenerator:
    def __init__(self, output_path="data/evaluation/synthetic_eval.json"):
        self.output_path = output_path
        self.subjects = ["Science", "Math", "History", "Geography"]
        self.grades = ["Grade 10", "Grade 9", "Grade 8"]
        
        # Simple templates for question generation (to be expanded with LLM eventually)
        self.templates = [
            "What is {topic}?",
            "Explain the concept of {topic}.",
            "How does {topic} work in {context}?",
            "Give me a short note on {topic} for {grade}."
        ]

    def generate_sample(self, n=50):
        """
        Creates a list of synthetic queries to test the system.
        """
        dataset = []
        for i in range(n):
            subject = random.choice(self.subjects)
            grade = random.choice(self.grades)
            
            # Placeholder for topic (in reality, we would extract these from actual book indexes)
            topic = f"Topic_{i}" 
            
            query = random.choice(self.templates).format(topic=topic, grade=grade, context=subject)
            
            dataset.append({
                "id": i,
                "query": query,
                "expected_metadata": {
                    "subject": subject,
                    "grade": grade
                },
                "language": "en"
            })
            
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        with open(self.output_path, "w", encoding="utf-8") as f:
            json.dump(dataset, f, indent=4)
            
        print(f"Generated {n} synthetic evaluation queries at {self.output_path}")

if __name__ == "__main__":
    generator = DatasetGenerator()
    generator.generate_sample(20)
