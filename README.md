# 🎓 NCERT AI Solver

An advanced, multilingual study assistant powered by Gemini AI and a Retrieval-Augmented Generation (RAG) pipeline. Designed to transform how students interact with NCERT textbooks (Grades 5-12).

![NCERT AI Banner](https://img.shields.io/badge/Status-Beta-accent)
![Vite](https://img.shields.io/badge/Vite-5.2-blue)
![React](https://img.shields.io/badge/React-18-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)

## ✨ Features

### 🧠 Intelligent Doubt Solver
- **Contextual Learning**: Select a chapter from the Archives to focus the AI's intelligence solely on that lesson.
- **Multilingual Support**: Supports Math, Science, English, Hindi, Urdu, and more.
- **Dynamic Citations**: AI responses include direct references to textbook pages.

### 📚 Digital Archives (Library)
- **Automatic Ingestion**: Processes PDFs and scans using advanced OCR.
- **Chapterized Navigation**: Organized library for quick access to school curriculum.

### 📊 Real-time Dashboard
- **Learning Progress**: Tracks "Overall Readiness" and "Science Mastery" dynamically.
- **Activity Feed**: View recent learning events (lessons started, doubts asked) synced live with **Firebase Firestore**.

### 📝 Diagnostic Assessments
- **AI Quizzes**: Generates dynamic quizzes based on your recent study topics.
- **Flashcards**: Quick recall practice for key concepts.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Framer Motion (Animations), Lucide (Icons), Tailwind CSS v4.
- **Backend**: FastAPI (Python), LangChain/RAG Pipeline.
- **AI Engine**: Google Gemini Pro 1.5.
- **Database**: Firebase Firestore (Progress & Analytics).
- **OCR**: Tesseract/GCP Vision integration.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key
- Firebase Project

### 2. Backend Setup
```bash
# Clone the repo
git clone https://github.com/yourusername/ncert-solver.git
cd ncert-solver

# Setup Python environment
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GOOGLE_API_KEY
```

### 3. Frontend Setup
```bash
cd src/ui
npm install

# Configure Firebase
cp .env.example .env.local
# Add your Firebase credentials (found in Firebase console)

# Run development server
npm run dev
```

---

## 📁 Project Structure

```text
├── src/
│   ├── api/          # FastAPI Backend
│   ├── rag/          # RAG Pipeline & Gemini logic
│   ├── ingestion/    # PDF Processing & OCR
│   └── ui/           # React + Tailwind Dashboard
├── data/
│   ├── raw/          # Original PDF textbooks
│   └── processed/    # JSON-ified textbook content
└── database/         # Local vector store (if applicable)
```

## 📜 License
This project is for educational purposes. All NCERT contents are trademarks of NCERT India.
