from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.telemetry.router import router as telemetry_router

app = FastAPI(
    title="RiskRadar API",
    description="AI/NLP SIF Precursor Detection Engine for Oil India Limited (SIH PS 26165)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(telemetry_router, prefix="/api")

@app.get("/")
def root():
    return {
        "service": "RiskRadar API",
        "organization": "Oil India Limited (OIL)",
        "problem_statement": "SIH26165",
        "status": "HEALTHY",
        "endpoints": {
            "docs": "/docs",
            "executive_overview": "/api/dashboard/executive-overview",
            "priority_queue": "/api/dashboard/priority-queue",
            "telemetry": "/api/telemetry/sites-summary",
            "reports": "/api/reports"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
