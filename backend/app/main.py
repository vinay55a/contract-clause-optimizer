"""
Contract Clause Optimizer — FastAPI Application Entry Point
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import create_tables
from app.api import auth, contracts, analysis, chatbot, negotiation, export

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    logger.info("Starting Contract Clause Optimizer API...")
    create_tables()
    
    logger.info("Database tables created.")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Contract Clause Optimizer API...")


app = FastAPI(
    title="Contract Clause Optimizer API",
    description="AI-powered contract analysis, clause optimization, and negotiation assistance",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", "http://localhost:5173"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload/export directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("exports", exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register API routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
app.include_router(chatbot.router, prefix="/chat", tags=["Chatbot"])
app.include_router(negotiation.router, prefix="/negotiation", tags=["Negotiation"])
app.include_router(export.router, prefix="/export", tags=["Export"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "message": "Contract Clause Optimizer API is running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "contract-clause-optimizer"}
