from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ReMind AI API",
    description="Backend API for ReMind AI - Memory Companion for Dementia Patients",
    version="1.0.0",
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Add production origins later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import faces, auth, patients, reminders, sos, analytics

@app.get("/")
def read_root():
    return {"message": "Welcome to ReMind AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(faces.router, prefix="/api/v1/faces", tags=["faces"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(patients.router, prefix="/api/v1/patients", tags=["patients"])
app.include_router(reminders.router, prefix="/api/v1/reminders", tags=["reminders"])
app.include_router(sos.router, prefix="/api/v1/sos", tags=["sos"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
