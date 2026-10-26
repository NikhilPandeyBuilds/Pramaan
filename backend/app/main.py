from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.db.base import Base
import app.models  # Ensure all models are registered
from app.utils.seed_data import seed_database

# Import routers
from app.api.routes import auth, applications, documents, validation, verification, review, rules, reports, dashboard

# Create tables
Base.metadata.create_all(bind=engine)

# Seed demo data if enabled
if settings.SEED_DEMO_DATA:
    with SessionLocal() as db:
        seed_database(db)

app = FastAPI(
    title="NiyamAI — AICTE Regulatory Intelligence Platform",
    description="Intelligent Application Validation, Document Authentication & Compliance Decision-Support System (SIH 26261)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_ORIGIN,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under API_PREFIX
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(applications.router, prefix=settings.API_PREFIX)
app.include_router(documents.router, prefix=settings.API_PREFIX)
app.include_router(validation.router, prefix=settings.API_PREFIX)
app.include_router(verification.router, prefix=settings.API_PREFIX)
app.include_router(review.router, prefix=settings.API_PREFIX)
app.include_router(rules.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)

@app.get("/health")
@app.get(f"{settings.API_PREFIX}/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database": "connected",
        "verification_adapter": settings.EXTERNAL_VERIFICATION_MODE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
