import logging
import joblib
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fleetflow-ml-service")

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
DELAY_MODEL_PATH = ARTIFACTS_DIR / "delay_model.joblib"
ETA_MODEL_PATH = ARTIFACTS_DIR / "eta_model.joblib"
ANOMALY_MODEL_PATH = ARTIFACTS_DIR / "anomaly_model.joblib"

# Global model store
_models = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing FleetFlow ML Microservice (Phase 7)")
    for name, path, key in [
        ("Delay Classifier", DELAY_MODEL_PATH, "delay"),
        ("ETA Regressor", ETA_MODEL_PATH, "eta"),
        ("Anomaly Detector", ANOMALY_MODEL_PATH, "anomaly"),
    ]:
        if path.exists():
            try:
                _models[key] = joblib.load(path)
                logger.info(f"Loaded {name} from {path.name}")
            except Exception as e:
                logger.warning(f"Failed to load {name}: {e}")
        else:
            logger.warning(f"{name} artifact not found at {path} — using heuristic baseline.")
    yield
    logger.info("Shutting down FleetFlow ML Microservice")


app = FastAPI(
    title="FleetFlow AI - ML Microservice",
    description="Phase 7: Real ML models for delay prediction, ETA estimation, and anomaly detection.",
    version="1.0.0-phase7",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expose the model store to routes
app.state.models = _models
app.include_router(router)


@app.get("/")
def root():
    loaded = {k: True for k in _models}
    return {
        "service": "FleetFlow AI - ML Microservice",
        "phase": 7,
        "docs": "/docs",
        "health": "/health",
        "status": "operational",
        "models_loaded": loaded,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
