# ClauseAI — Contract Negotiation & Clause Optimization Assistant

> **AI-powered legal-tech platform** for contract analysis, clause optimization, risk scoring, and negotiation assistance — powered by Google Gemini AI.

![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-2563EB?style=flat-square)
![Stack](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLAlchemy-10B981?style=flat-square)
![Stack](https://img.shields.io/badge/AI-Gemini%20API%20Ready-F59E0B?style=flat-square)
![Stack](https://img.shields.io/badge/DB-SQLite%20%2F%20PostgreSQL-8B5CF6?style=flat-square)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Contract Upload** | PDF, DOCX, or paste raw text — drag & drop supported |
| 🔍 **Clause Detection** | Auto-detects 12+ clause types with confidence scores |
| 🤖 **AI Optimization** | Plain English explanations, rewrites, client/vendor versions |
| 📊 **Risk Score** | 0-100 health score with per-category radar chart breakdown |
| 💬 **Negotiation AI** | Ask questions, get structured negotiation strategies |
| 🗨️ **ClauseAI Chatbot** | Floating chatbot available on every page |
| 🔄 **Side-by-Side Comparison** | Original vs optimized clause diff view |
| 📤 **Export** | PDF & DOCX analysis reports |
| 🔐 **JWT Auth** | Register, login, secure per-user data |
| 📜 **History** | Full contract & chat history |

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- No database setup needed (uses SQLite by default)

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**  
API docs (Swagger): **http://localhost:8000/docs**

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 3. First Time Use

1. Open **http://localhost:5173**
2. Click **Create Account** and register
3. Go to **Upload Contract**
4. Upload a PDF/DOCX or use the sample: `docs/sample_contract.txt`
5. Click **Analyze Contract with AI**
6. Explore the **Analysis**, **Negotiation**, and **Comparison** pages

---

## 🔑 Gemini API Integration

The app works in **mock mode** by default (no API key needed). To enable real AI:

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Edit `backend/.env`:
   ```env
   GEMINI_API_KEY=your-actual-api-key-here
   USE_MOCK_AI=false
   GEMINI_MODEL=gemini-1.5-flash
   ```
3. Restart the backend server

---

## 🐳 Docker Setup

```bash
# Copy env
copy .env.example .env

# Start all services (PostgreSQL + Backend + Frontend)
docker-compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Database: localhost:5432

---

## 📁 Project Structure

```
contract-clause-optimizer/
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios API client
│   │   ├── components/    # Layout, Chatbot, shared components
│   │   ├── context/       # React Auth context
│   │   └── pages/         # All 10 page components
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI route handlers
│   │   │   ├── auth.py
│   │   │   ├── contracts.py
│   │   │   ├── analysis.py
│   │   │   ├── chatbot.py
│   │   │   ├── negotiation.py
│   │   │   └── export.py
│   │   ├── services/      # Business logic
│   │   │   ├── gemini_service.py   # ← Add your API key here
│   │   │   ├── contract_parser.py
│   │   │   ├── clause_detector.py
│   │   │   ├── optimizer.py
│   │   │   └── risk_engine.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── utils.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── docs/
│   └── sample_contract.txt
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, get JWT |
| GET | `/auth/me` | Current user profile |
| POST | `/contracts/upload` | Upload PDF/DOCX/text |
| GET | `/contracts` | List user contracts |
| GET | `/contracts/{id}` | Get contract details |
| DELETE | `/contracts/{id}` | Delete contract |
| POST | `/analysis/run/{id}` | Run AI analysis |
| GET | `/analysis/{id}` | Get analysis results |
| POST | `/chat/message` | Send chatbot message |
| GET | `/chat/history` | Chat history |
| POST | `/negotiation/suggest` | Get negotiation AI suggestions |
| GET | `/negotiation/history/{id}` | Negotiation history |
| GET | `/export/pdf/{id}` | Download PDF report |
| GET | `/export/docx/{id}` | Download DOCX report |

---

## 🎨 Design System

| Token | Color | Use |
|---|---|---|
| Navy | `#0F172A` | Background |
| Blue | `#2563EB` | Primary accent |
| Cyan | `#06B6D4` | Secondary accent |
| Emerald | `#10B981` | Low risk / success |
| Amber | `#F59E0B` | Medium risk / warning |
| Red | `#EF4444` | High risk / danger |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite 6
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Framer Motion (animations)
- React Router v7
- Chart.js + react-chartjs-2
- Lucide React icons
- React Dropzone
- Axios

**Backend**
- FastAPI + Uvicorn
- SQLAlchemy 2.0 ORM
- Pydantic v2
- python-jose (JWT)
- passlib + bcrypt
- pdfplumber (PDF parsing)
- python-docx (DOCX parsing)
- ReportLab (PDF export)
- Google Generative AI SDK

**Database**
- SQLite (development — zero config)
- PostgreSQL (production / Docker)

---

## 🔮 Extending with More AI

The `gemini_service.py` service is designed to be easily swapped:

```python
# To use a different LLM, replace _call_gemini() with your provider:
# - OpenAI: openai.chat.completions.create(...)
# - Anthropic: anthropic.messages.create(...)
# - LangChain: LLMChain with any provider
```

All prompts are in structured templates at the top of `gemini_service.py`.

---

## 📝 License

MIT License — free for commercial and personal use.
