# ReMind AI — Implementation Plan

> **AI-Powered Memory Companion for Dementia Patients**
> Full-stack, production-grade healthcare platform. This document defines *what* we build and *in what order*. Progress is tracked separately in [`implementation-status.md`](implementation-status.md).

---

## 1. Project Summary

ReMind AI helps dementia patients **recognize familiar faces**, **remember daily activities**, **receive medication reminders**, and **stay connected** with family and caregivers. It must be **empathetic by design, voice-first for elderly users, and deployable entirely on free-tier cloud infrastructure**.

**Target quality bar:** Smart India Hackathon submission · final-year engineering project · startup MVP · healthcare tech demo. Every module complete, polished, and deployable — no placeholders, no stubs.

---

## 2. Technology Stack

| Layer | Choice |
|-------|--------|
| **Frontend** | Next.js 15 (App Router) + TypeScript · Tailwind CSS + ShadCN UI · Framer Motion · Lucide React · Zustand |
| **Backend** | FastAPI (Python 3.11+) · async endpoints · dependency injection · middleware · auto Swagger at `/docs` |
| **AI / CV** | DeepFace + FaceNet (128-dim embeddings) · cosine similarity · OpenCV + NumPy · target < 2s recognition |
| **Database** | PostgreSQL (Neon free tier) · Alembic migrations · UUID PKs · indexed FKs · pgvector or JSON embeddings |
| **Storage** | Cloudinary free tier (auto-optimization) |
| **Auth** | JWT RS256 (access 15 min / refresh 7 days) · bcrypt (cost 12) · RBAC: patient / caregiver / family_member / admin |
| **Deployment** | Vercel (frontend) · Render.com Docker (backend) · Neon (DB) · Cloudinary · GitHub Actions CI/CD |
| **Testing** | Pytest (≥80% coverage) · Vitest + Testing Library · Playwright E2E · axe-core a11y |

---

## 3. Guiding Principles

1. **Clean architecture** — routes → services → repositories → models/schemas. SOLID throughout, single responsibility per unit.
2. **Fully typed** — no `any` in TypeScript; Pydantic validation on every backend endpoint.
3. **Test-in-phase** — each feature phase ships with its own tests. Phase 12 hardens coverage, adds E2E + a11y CI.
4. **Consistent API envelopes** — every response uses `{ status, data, error }`.
5. **Security first** — RBAC at the API layer, secrets in env only, audit logging for all mutations.
6. **Accessibility non-negotiable** — WCAG 2.1 AA, Lighthouse ≥ 90 mobile on the patient interface.
7. **Empathetic UX** — warm palette, large text, voice-first, max 3 actions per patient screen.

### ⚠️ Sequencing note (important)
The source prompt says "start with Module 1 (Patient Interface)." We instead build **foundations first** (scaffold → DB → auth → domain → AI engine) *before* the patient UI, because the Patient Interface depends on all of them. **Every module and every requirement in the prompt is still delivered in full** — only the build *order* is optimized for buildability, the way a senior team would sequence it. Module → Phase mapping is in §5.

---

## 4. Phased Roadmap

Phases are grouped into four stages. Each phase is independently demonstrable and has a clear **Definition of Done (DoD)**.

### 🏗️ Stage A — Foundation

#### Phase 0 — Project Scaffold & Tooling
- **Goal:** A booting monorepo with both apps running empty-but-structured.
- **Scope:**
  - Monorepo layout: `frontend/`, `backend/`, `database/`, `docs/`, `deployment/`, `scripts/`, `tests/`, `.github/workflows/`
  - Root files: `.gitignore`, `README.md`, `.env.example`, `LICENSE`
  - Frontend init: Next.js 15 + TS + Tailwind + ShadCN + Framer Motion + Lucide; base theme tokens (colors, typography), dark mode, Zustand store skeleton
  - Backend init: FastAPI app factory, config (Pydantic Settings), CORS + middleware, health check, `/docs`
  - Local Docker: `Dockerfile` (backend), `docker-compose.yml` (backend + postgres + redis)
  - Tooling: ESLint/Prettier, ruff/black, pytest, vitest, playwright configs
- **DoD:** `docker-compose up` runs; frontend renders a themed landing page; `GET /health` returns OK; `/docs` loads.

#### Phase 1 — Database Layer & Migrations
- **Goal:** Full normalized schema live and seedable.
- **Scope:**
  - SQLAlchemy ORM models for all 9 tables (§ schema below)
  - Alembic migration environment + initial migration
  - UUID PKs, `created_at`/`updated_at` on every table, indexes on all FKs + hot columns
  - `database/` raw SQL + seed script (`scripts/seed.py`)
  - Neon provisioning guide in `docs/`
- **DoD:** `alembic upgrade head` builds schema on Neon + local; seed data loads without errors.

#### Phase 2 — Authentication & RBAC
- **Goal:** Secure identity foundation used by every later phase.
- **Scope:**
  - JWT RS256 (access 15 min, refresh 7 days), bcrypt cost 12, key generation script
  - Endpoints: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
  - RBAC via FastAPI dependencies (patient / caregiver / family_member / admin)
  - Rate limiting (100 req/min per IP; 10 auth/min per email), CORS lockdown
  - Frontend: login + register pages, API client with token refresh interceptor, protected route guard, Zustand auth slice
  - Tests: login, refresh, logout, role enforcement
- **DoD:** A caregiver can register + log in; protected endpoints reject bad/missing tokens and wrong roles.

### 🧩 Stage B — Core Domain & AI

#### Phase 3 — Patients, Family Members & Caregiver Dashboard (Module 3)
- **Goal:** Caregivers manage their support network end-to-end.
- **Scope:**
  - Patient CRUD (`GET/POST /patients`, `GET/PUT /patients/{id}`) + service layer
  - Family member CRUD, relationship types, search/filter
  - Cloudinary integration (upload, validation: image-only, ≤10MB)
  - CSV bulk import (with photo URL column)
  - Caregiver Dashboard UI: data tables (sort/filter/paginate), modal forms with inline validation, activity/recognition history views, real-time patient status
- **DoD:** Caregiver creates a patient, adds family members with photos, bulk-imports a CSV, sees them in a data table.

#### Phase 4 — AI Face Recognition Engine (Module 2)
- **Goal:** Accurate, fast, fault-tolerant recognition.
- **Scope:**
  - `app/ai/`: DeepFace + FaceNet embedding generation, OpenCV/NumPy preprocessing
  - Endpoints: `POST /faces/register`, `POST /faces/recognize`, `GET /faces/{member_id}`, `DELETE /faces/{embedding_id}`
  - 128-dim embedding storage; cosine similarity matching; multi-face detection; rank top-3; graceful "Unknown Person"
  - Embedding refresh when new photos added; recognition event logging (timestamp, confidence, outcome)
  - Tests with a sample dataset (≥10 known faces); performance assertion < 2s
- **DoD:** Recognition API returns ranked matches with confidence in < 2s; unknowns handled gracefully.

#### Phase 5 — Patient Interface (Module 1)
- **Goal:** The warm, calming, elderly-first screen tying face recognition + reminders + SOS together.
- **Scope:**
  - Accessibility-first layout: ≥24px body / ≥36px primary actions, contrast ≥4.5:1, max 3 actions/screen, warm palette, scroll-free where possible
  - Live camera feed + real-time face detection overlay (`useCamera`), start/stop, manual + auto scan
  - Recognition result display: large name, relationship label, profile photo w/ animation, friendly confidence (High/Med/Low), plain-language last interaction, top-3 fallback
  - Scrollable reminder feed; always-visible Emergency SOS button (bottom-right)
- **DoD:** Patient starts the camera, scans a face, and sees a full recognition card; SOS button always pinned.

### 🚀 Stage C — Feature Modules

#### Phase 6 — Reminder & Medication System (Module 4)
- **Scope:** categories (medicine/meals/hydration/appointments/calls/sleep/custom), priorities (Critical→Low), recurrence (daily/weekly/custom); endpoints `GET /reminders/{patient_id}`, `POST /reminders`, `PUT /reminders/{id}`, `PATCH /reminders/{id}/status`, `DELETE`; completed/snoozed/missed states logged; calendar + timeline views; compliance stats (rate, missed, streak); caregiver alert on missed critical.
- **DoD:** Full reminder lifecycle works; compliance stats compute; missed-critical notifies caregiver.

#### Phase 7 — Voice Assistant (Module 6)
- **Scope:** Web Speech API STT + TTS (`useVoice`); commands ("Who is this?", "Show my reminders", "What medicine should I take?", "Call my daughter", "Repeat that", "Help me"); languages English/Hindi/Marathi; continuous-listening indicator; text fallback; voice feedback on recognition; all commands logged.
- **DoD:** Each supported command triggers its action hands-free; graceful fallback when voice unavailable.

#### Phase 8 — Emergency SOS System (Module 5)
- **Scope:** endpoints `POST /sos/{patient_id}`, `GET /sos/{patient_id}/history`, `PATCH /sos/{event_id}/resolve`; pinned red button, single-tap (no confirm), voice trigger ("Help me"/"Emergency"); notify all contacts (simulated + push); panic mode (red screen, countdown, alarm); location placeholder map; full event logging; caregiver SOS history w/ resolution.
- **DoD:** SOS triggers by tap and voice; panic mode plays; event logged and resolvable from dashboard.

#### Phase 9 — Family Portal (Module 7)
- **Scope:** family_member-scoped login; daily activity timeline; recognition history; reminder completion + missed-medication flags; upload own photos to improve accuracy; add/edit reminders; SOS push notifications; read-only analytics.
- **DoD:** A family member logs in, views timeline/history, uploads a photo, adds a reminder — but cannot change system settings.

#### Phase 10 — Analytics Dashboard (Module 8)
- **Scope:** endpoints `GET /analytics/{patient_id}/summary|recognitions|reminders`; KPI cards; recognition-accuracy trend (30-day); compliance bar chart by category; weekly activity heatmap by hour; monthly summary vs prior month; PDF export; Recharts, responsive + animated.
- **DoD:** Dashboard renders all charts from live data; one-click PDF export works.

### 🛡️ Stage D — Hardening & Ship

#### Phase 11 — UI/UX Polish, Accessibility & Cross-cutting
- **Scope:** finalize visual identity (cream `#FFF8F0`, blue `#4A90D9`, green `#52C41A`, red `#D9363E`), Inter/DM Sans; cards (12px radius, soft shadow), glassmorphism overlays, skeleton loaders, toasts (Sonner), empty/error states, full dark mode, visible focus rings; wire notifications table; ensure activity_logs audit coverage on all mutations; Lighthouse ≥90 mobile.
- **DoD:** WCAG AA passes; Lighthouse ≥90 on patient interface; every mutation writes an audit log.

#### Phase 12 — Testing & QA
- **Scope:** Pytest unit (mocked deps) + integration (TestClient) to ≥80% coverage; face tests on sample dataset; auth-flow tests; Vitest + Testing Library component tests; Playwright E2E (login, face scan, add reminder, trigger SOS); axe-core audit in CI.
- **DoD:** Full suite green; coverage ≥80%; E2E + a11y run in CI.

#### Phase 13 — Deployment & DevOps
- **Scope:** multi-stage `Dockerfile` (python:3.11-slim), `docker-compose.yml`, `render.yaml`, `vercel.json`, `.env.example`; `.github/workflows/ci.yml` (lint, type-check, tests, coverage on PR) + `deploy.yml` (deploy on main, smoke test on release tag); deployment checklist (Neon, Cloudinary, Render, Vercel, domain, health checks, rollback); architecture diagrams (Mermaid), API docs, user guides in `docs/`.
- **DoD:** Fresh clone deploys to Vercel + Render + Neon + Cloudinary following the checklist; CI green on PR; app reachable over HTTPS.

---

## 5. Module → Phase Coverage Map

| Prompt Module | Delivered in |
|---------------|--------------|
| Module 1 — Patient Interface | Phase 5 (+ polish P11) |
| Module 2 — AI Face Recognition Engine | Phase 4 |
| Module 3 — Caregiver Dashboard | Phase 3 (+ analytics P10) |
| Module 4 — Reminder & Medication System | Phase 6 |
| Module 5 — Emergency SOS System | Phase 8 |
| Module 6 — Voice Assistant | Phase 7 |
| Module 7 — Family Portal | Phase 9 |
| Module 8 — Analytics Dashboard | Phase 10 |
| DB schema / API design | Phases 1–2 (+ per feature) |
| Security requirements | Phase 2 (+ enforced per phase) |
| Testing strategy | Test-in-phase + Phase 12 |
| Deployment & DevOps | Phase 13 |

---

## 6. Database Schema (target)

UUID PKs everywhere · `created_at`/`updated_at` on all tables · indexes on all FKs + hot columns.

- **users** — id, email, password_hash, role, name, phone, created_at
- **patients** — id, user_id (FK), caregiver_id (FK), name, dob, medical_notes, created_at
- **family_members** — id, patient_id (FK), user_id (FK), name, relationship, phone, created_at
- **face_embeddings** — id, family_member_id (FK), embedding (JSON/vector), photo_url, created_at
- **reminders** — id, patient_id (FK), category, title, description, scheduled_at, recurrence, priority, status, created_by (FK)
- **recognitions** — id, patient_id (FK), matched_member_id (FK, nullable), confidence, is_unknown, image_url, created_at
- **emergency_events** — id, patient_id (FK), trigger_method, contacts_notified, resolved_at, created_at
- **notifications** — id, user_id (FK), type, message, read_at, created_at
- **activity_logs** — id, patient_id (FK), action_type, detail (JSONB), created_at

---

## 7. External Accounts & Secrets Needed

These are **blockers** for the phases noted — the user must provision them (see status file for live tracking):

| Service | Needed by | Secret(s) |
|---------|-----------|-----------|
| Neon PostgreSQL | Phase 1 | `DATABASE_URL` |
| Cloudinary | Phase 3 | `CLOUDINARY_URL` / cloud name, API key, secret |
| JWT keypair | Phase 2 | RS256 private/public keys (we can generate) |
| GitHub repo | Phase 0/13 | remote origin (gh auth pending) |
| Render.com | Phase 13 | service + env vars |
| Vercel | Phase 13 | project + env vars |

Where a real service isn't wired yet, the phase proceeds against **local Docker Postgres** and mock/stub adapters, swapping to the live service once credentials arrive.

---

## 8. Working Agreement

- We proceed **one phase at a time**; each phase ends with a demo + a status update.
- After each phase: mark it Done in [`implementation-status.md`](implementation-status.md), then get a go-ahead before starting the next.
- Code is committed per phase; push happens when the user approves (GitHub login pending).
