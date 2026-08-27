# 🧠 ReMind AI

> **An AI-Powered Memory Companion for Dementia Patients**
> Helping people living with dementia recognize loved ones, remember daily activities, receive medication reminders, and stay safe — with peace of mind for the caregivers and family who support them.

ReMind AI is a full-stack, production-grade healthcare platform built to a Smart India Hackathon / final-year engineering / startup-MVP quality bar. It is **empathetic by design, voice-first for elderly users, and deployable entirely on free-tier cloud infrastructure.**

---

## ✨ Core Modules

| Module | What it does |
|--------|--------------|
| 👁️ **Face Recognition** | Recognizes familiar faces in under 2 seconds and shows name, relationship, and a warm greeting |
| ⏰ **Reminders & Medication** | Gentle, recurring reminders with completion / snooze / missed tracking and compliance stats |
| 🗣️ **Voice Assistant** | Voice-first interaction (English / Hindi / Marathi) with speech-to-text and text-to-speech |
| 🚨 **Emergency SOS** | One-tap panic button that alerts caregivers and family instantly |
| 🧑‍⚕️ **Caregiver Dashboard** | Manage patients, reminders, and support network; review recognition & activity history |
| 👨‍👩‍👧 **Family Portal** | Add faces & memories, upload training photos, follow the daily timeline |
| 📊 **Analytics** | KPIs, trends, and compliance reporting with PDF export |
| ♿ **Accessibility** | WCAG 2.1 AA, large text, high contrast, ≤ 3 actions per patient screen |

---

## 🏗️ Tech Stack

| Layer | Choice |
|-------|--------|
| **Frontend** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · ShadCN UI · Framer Motion · Lucide · Zustand |
| **Backend** | FastAPI (Python 3.11+) · async · dependency injection · app-factory pattern · auto Swagger at `/docs` |
| **AI / CV** | DeepFace + FaceNet (128-dim embeddings) · cosine similarity · OpenCV + NumPy · target < 2s recognition |
| **Database** | PostgreSQL (Neon) · SQLAlchemy · Alembic · UUID PKs · indexed FKs (SQLite fallback for local dev) |
| **Storage** | Cloudinary |
| **Auth** | JWT · bcrypt · RBAC (patient / caregiver / family_member / admin) |
| **Deployment** | Vercel (frontend) · Render.com Docker (backend) · Neon (DB) · GitHub Actions CI/CD |
| **Testing** | Pytest · Vitest + Testing Library · Playwright · axe-core |

> Every response from the API uses a consistent envelope: `{ "status", "data", "error" }`.

---

## 📁 Repository Layout

```
Remind AI/
├── frontend/            # Next.js 16 app (App Router)
│   └── src/
│       ├── app/         # routes: / (landing), /patient, /caregiver, /family
│       ├── components/  # UI + feature components
│       └── stores/      # Zustand state
├── backend/             # FastAPI service
│   └── app/
│       ├── api/         # routers (auth, patients, faces, reminders, sos, analytics)
│       ├── core/        # config, logging, middleware, database
│       ├── models/      # SQLAlchemy models
│       ├── schemas/     # Pydantic schemas (incl. response envelope)
│       └── ai/          # face recognition engine
├── database/            # SQL + migrations assets
├── deployment/          # Dockerfile, docker-compose.yml, render.yaml
├── docs/                # architecture & guides
├── scripts/             # dev / seed scripts
├── implementation-plan.md    # what we build and in what order
└── implementation-status.md  # living progress tracker
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 20 and npm
- **Python** ≥ 3.11
- (Optional) **Docker** — for the full local stack (backend + Postgres + Redis)

### 1. Clone & configure
```bash
git clone https://github.com/yashrajagawane/Remind-AI.git
cd "Remind AI"
cp .env.example .env    # then fill in values
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate      # Windows (Git Bash);  use .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```
- API root: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/health>

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
- App: <http://localhost:3000>

### 4. (Optional) Full stack via Docker
```bash
docker compose -f deployment/docker-compose.yml up --build
```

---

## 🔑 Environment Variables

All configuration is via environment variables — see [`.env.example`](.env.example) for the full annotated list (database, Redis, auth, CORS, Cloudinary, and the frontend API URL).

---

## 🧪 Quality & Tooling

| Area | Command |
|------|---------|
| Backend lint | `ruff check .` (in `backend/`) |
| Backend format | `black .` (in `backend/`) |
| Backend tests | `pytest` (in `backend/`) |
| Frontend lint | `npm run lint` (in `frontend/`) |
| Frontend types | `npm run typecheck` (in `frontend/`) |
| Frontend format | `npm run format` (in `frontend/`) |
| Frontend build | `npm run build` (in `frontend/`) |

---

## 🗺️ Roadmap & Progress

This project is built **phase by phase** (0 → 13), foundations first. Track it here:
- 📋 [Implementation Plan](implementation-plan.md) — the full phased roadmap and definitions of done
- ✅ [Implementation Status](implementation-status.md) — living progress tracker

---

## 📄 License

Released under the [MIT License](LICENSE).

## 👤 Author

**Yashraj Agawane** — [@yashrajagawane](https://github.com/yashrajagawane)
