from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# In production this should be a Postgres connection string with pgvector extension enabled.
# For local dev without neon setup, we default to SQLite. Note: SQLite does not natively support pgvector.
# We will store embeddings as JSON for local dev fallback or use a mock.

engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
