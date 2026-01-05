🎓 NCERT AI Solver: The Intelligence-Native Mastery Platform
An advanced, premium-styled academic assistant powered by Ollama (Qwen 2.5/3) and a Retrieval-Augmented Generation (RAG) pipeline. This project transforms passive reading into an interactive, AI-driven learning experience powered by a local intelligence layer.

🌟 The Evolution: From "Solver" to "Coach"
The NCERT AI Solver has evolved from a tool to answer textbook questions into an Academic Coach. It doesn't just clear doubts; it analyzes your learning patterns to set daily missions, tracks your commitment, and visualizes your path to mastery.

💡 The "Intelligence Layer" Architecture
The architecture is LLM-Native, using a sophisticated agentic loop to personalize every interaction:

NCERT Digital Library → RAG Retrieval → AI Solver
User Engagement Data → Real-time Feed → AI Intelligence Layer (Ollama/Qwen)
                      ↓                    ↓
                 Daily AI Missions    Readiness Score
                      ↓                    ↓
                 Student Dashboard ← Citations + Visual Progress
                      ↓
                 Firebase Firestore (Feedback Loop)
                 
✨ Premium Features
🎯 The Daily AI Mission
Using Ollama (Qwen), the app analyzes subject mastery scores and creates dedicated missions with XP rewards.

🧠 Intelligent Readiness Score
Multi-dimensional metric calculating exam readiness based on:

Foundational Mastery (Base 60%)
Lesson Completion (+5% per module)
Active Engagement (+1% per doubt solved)
Diagnostic Validation (+2% per quiz score)

✅ Diagnostic Hub (Assess)
AI Flashcards for rapid revision
Interactive Quizzes with instant scoring

🏠 Personalized Home Hub
Study Personas (Architect, Sprinter, Analyst)
Radial Commitment Tracker
Subject Mastery Grid with progress visualization

🛠️ Tech Stack
Frontend: React 18 (Vite), Framer Motion, Tailwind CSS v4
Backend: FastAPI (Python), LangChain
Intelligence: Ollama (Qwen 2.5/3), Google Gemini 1.5 Pro (fallback)
Storage/Auth: Firebase Firestore & Authentication
Vector Engine: Semantic indexing for NCERT textbooks

🚀 Setup & Launch
Requirements
Ollama installed and running
Python 3.10+
Node.js 18+

Backend
git clone https://github.com/yourusername/ncert-solver.git
cd ncert-solver
pip install -r requirements.txt
cp .env.example .env
python src/api/main.py


Frontend
cd src/ui
npm install
npm run dev
graph TD



📜 Project Vision
To bridge the "Doubt Gap" in Indian education by providing every student with an elite, AI-driven study partner that understands 
the NCERT curriculum with 24/7 availability.


