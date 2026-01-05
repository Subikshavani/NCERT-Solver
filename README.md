# NCERT AI Solver

A premium-styled, AI-powered academic coach for NCERT learners. Built with a Retrieval-Augmented Generation (RAG) pipeline, FastAPI, and a modern React frontend to turn passive reading into interactive mastery.

## Table of Contents
- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

## About The Project
![Product Screenshot](images/screenshot.png)

NCERT AI Solver evolves from a simple Q&A bot into a personalized academic coach. It retrieves NCERT textbook context, plans daily AI missions, tracks readiness scores, and surfaces citations so learners get trustworthy, adaptive guidance.

**Why this template?**
- Focus on building the product, not rewriting README boilerplate.
- DRY your documentation workflow with a reusable structure.
- Clear sections for onboarding contributors and users.

Use the existing structure to start fast, or adjust sections to fit your needs.

[back to top](#table-of-contents)

## Built With
- FastAPI, Python 3.11+
- React 18, Vite, Tailwind CSS
- Framer Motion
- Ollama (Qwen 2.5/3) + Gemini (fallback)
- Pinecone (vector search)
- Firebase Auth/Firestore

[back to top](#table-of-contents)

## Getting Started
Follow these steps to run the project locally.

### Prerequisites
- Python 3.11+
- Node.js 18+
- Ollama running locally with Qwen 2.5/3 models pulled
- (Optional) Access to Pinecone and Firebase credentials

### Installation
1) Clone the repo
```bash
git clone https://github.com/Subikshavani/NCERT-Solver.git
cd NCERT-Solver
```
2) Backend setup
```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# fill in API keys: Ollama, Pinecone, Firebase, etc.
```
3) Frontend setup
```bash
cd src/ui
npm install
```
4) Update git remote if you forked
```bash
git remote set-url origin <your_fork_url>
git remote -v
```

[back to top](#table-of-contents)

## Usage
1) Start backend
```bash
cd NCERT-Solver
.venv\Scripts\activate
python src/api/main.py
```
2) Start frontend
```bash
cd src/ui
npm run dev
```
3) Visit the dev URL shown in the terminal. Log in (Firebase) and start asking NCERT questions or running daily missions.

[back to top](#table-of-contents)

## Roadmap
- Add changelog automation (Keep a Changelog)
- Add "back to top" links in UI docs
- Add additional README templates with examples
- Add components doc for copy/paste snippets
- Multi-language support (Hindi, English)

See open issues for planned features and known issues.

[back to top](#table-of-contents)

## Contributing
Contributions are welcome!
1) Fork the project
2) Create your feature branch (`git checkout -b feature/AmazingFeature`)
3) Commit changes (`git commit -m "Add some AmazingFeature"`)
4) Push to your branch (`git push origin feature/AmazingFeature`)
5) Open a pull request

[back to top](#table-of-contents)

## License
Distributed under the MIT License. See LICENSE.txt for details.

[back to top](#table-of-contents)

## Contact
Your Name — your.email@example.com — [Project Link](https://github.com/Subikshavani/NCERT-Solver)

[back to top](#table-of-contents)

## Acknowledgments
- Choose an Open Source License
- GitHub Emoji Cheat Sheet
- Malven's Flexbox Cheatsheet
- Malven's Grid Cheatsheet
- Shields.io badges
- GitHub Pages
- Font Awesome
- React Icons

[back to top](#table-of-contents)


