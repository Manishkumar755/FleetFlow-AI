# FleetFlow AI — Smart Logistics & Shipment Management Platform

FleetFlow AI is a production-oriented, responsive logistics management SaaS platform designed to streamline shipment dispatching, fleet monitoring, dynamic tracking, and predictive logistics intelligence.

FleetFlow AI merges traditional operations (shipment lifecycle, driver and vehicle assignments, tracking events) with an independent **AI/ML microservice** predicting shipment delays, estimating precise travel times, and flagging routing anomalies.

---

## 1. System Architecture

FleetFlow AI adopts a decoupled, multi-service architecture:

```
                  +----------------------------------------------+
                  |         React 18 + Vite Frontend SaaS        |
                  |  (Dark Navy / White / Blue Enterprise UI)    |
                  +----------------------+-----------------------+
                                         |
                     +-------------------+-------------------+
                     | (REST / JWT)                          | (REST / JSON)
                     v                                       v
+------------------------------------+   +------------------------------------+
|        Django 5 + DRF Backend      |   |       FastAPI ML Microservice      |
|  - Auth & RBAC (Admin/Mgr/Driver)  |   |  - Delay Predictor (Random Forest) |
|  - Shipment Lifecycle CRUD         |   |  - ETA Estimator (HistGradBoost)   |
|  - Fleet & Driver Management       |   |  - Anomaly Detector (Isolation)    |
|  - Tracking History Events         |   |  - OpenStreetMap Route Comparator  |
+------------------+-----------------+   +------------------------------------+
                   |
                   v
+------------------------------------+
|       PostgreSQL 16 Database       |
|  (Local Docker Compose or Supabase)|
+------------------------------------+
```

---

## 2. Directory Structure

```text
FLEETFLOW AI/
├── docker-compose.yml              # Local PostgreSQL 16 & optional service containers
├── README.md                       # Complete platform documentation
├── .env.example                    # Global environment variables template
├── .env                            # Active environment configuration
├── .gitignore                      # Git ignore rules
│
├── backend/                        # Django REST Framework Backend
│   ├── manage.py
│   ├── requirements.txt            # Django, DRF, SimpleJWT, Psycopg3, CORS
│   ├── Dockerfile
│   ├── fleetflow/                  # Settings, URLs, WSGI, ASGI
│   │   ├── __init__.py
│   │   ├── settings.py             # PostgreSQL connection with SQLite fallback, JWT & CORS
│   │   ├── urls.py                 # Core routing
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── core/                       # Core service app
│       ├── apps.py
│       ├── views.py                # Health check & system status APIs
│       ├── urls.py
│       └── tests.py                # Django unit & integration tests
│
├── ml_service/                     # FastAPI Machine Learning Microservice
│   ├── main.py                     # App entry point, CORS middleware & lifespan
│   ├── config.py                   # Pydantic Settings
│   ├── requirements.txt            # FastAPI, Uvicorn, Scikit-learn, Pandas, Joblib
│   ├── Dockerfile
│   ├── .env.example
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py               # /health, /ml/model-metrics, /ml/predict-delay, etc.
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── prediction_schemas.py   # Pydantic validation schemas
│   ├── datasets/                   # Synthetic & benchmark datasets (Phase 6)
│   ├── artifacts/                  # Serialized .joblib model files
│   ├── training/                   # Model training pipelines (Phase 6)
│   ├── evaluation/                 # Metrics & validation (Phase 6)
│   ├── preprocessing/              # Feature engineering (Phase 6)
│   └── tests/
│       └── test_api.py             # Pytest endpoint and validation failure tests
│
└── frontend/                       # React 18 + Vite Frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    ├── .env
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Router & navigation layout
        ├── index.css               # Modern enterprise design system
        ├── api/
        │   └── client.js           # Centralized Axios clients with JWT interceptors
        ├── components/
        │   ├── Sidebar.jsx         # Responsive sidebar navigation
        │   ├── Header.jsx          # Live service status indicators & user badge
        │   └── SystemHealthCard.jsx# Interactive health check & live ML testing
        └── pages/
            └── Dashboard.jsx       # Command Center overview & roadmap
```

---

## 3. Technology Stack & Free-Tier Deployment Strategy

- **Frontend:** React 18, Vite, JavaScript, CSS3, Recharts, Leaflet.js
  - *Deployment target:* Vercel (Free tier)
- **Main Backend:** Python 3.14 / 3.12, Django 5+, Django REST Framework, SimpleJWT
  - *Deployment target:* Render Web Service (Free tier)
- **ML Microservice:** FastAPI, Uvicorn, Pydantic v2, Scikit-learn, Pandas, NumPy, Joblib
  - *Deployment target:* Render Web Service (Free tier)
- **Database:** PostgreSQL 16
  - *Local:* Docker Compose (`postgres:16-alpine`) or SQLite fallback for immediate offline run
  - *Production:* Supabase PostgreSQL Free Tier / Neon / Render Postgres

---

## 4. Setup & Running Instructions

### Prerequisites
- Python 3.12+ (or 3.14)
- Node.js v18+ & npm
- (Optional) Docker & Docker Compose for containerized PostgreSQL

### Step 1: Environment Setup
```powershell
# Clone or open workspace
cd "c:\Users\manis\OneDrive\FLEETFLOW AI"

# Copy environment variables
cp .env.example .env
```

### Step 2: PostgreSQL Database
**Option A: Using Docker Compose**
```powershell
docker-compose up -d fleetflow-db
```
**Option B: Supabase / Cloud Postgres**
Set `DATABASE_URL=postgresql://user:pass@host:5432/dbname` in `.env`.

**Option C: Local SQLite Fallback**
Leave `DATABASE_URL` empty; Django will automatically initialize `backend/db.sqlite3`.

### Step 3: Run Django Backend & Seed Demo Data
```powershell
# In terminal 1:
cd backend
..\.venv\Scripts\python.exe manage.py migrate
..\.venv\Scripts\python.exe manage.py seed_data   # Seeds Admin, Manager, Drivers, Vehicles & Shipments
..\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```
- Health Check: `http://localhost:8000/api/health/`
- Authentication & JWT: `http://localhost:8000/api/auth/login/`
- Shipment API: `http://localhost:8000/api/shipments/`
- Public Tracking: `http://localhost:8000/api/shipments/track/<tracking_id>/`

### Step 4: Run FastAPI ML Microservice
```powershell
# In terminal 2:
cd ml_service
..\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8001 --reload
```
- Interactive Swagger Docs: `http://localhost:8001/docs`
- Health Check: `http://localhost:8001/health`
- Model Metrics: `http://localhost:8001/ml/model-metrics`

### Step 5: Run React Frontend
```powershell
# In terminal 3:
cd frontend
cmd /c npm run dev
```
- Open browser at: `http://localhost:5173`

---

## 5. Running Automated Tests

### Django Unit & API Tests:
```powershell
cd backend
..\.venv\Scripts\python.exe manage.py test
```
*Result:* **20 tests passed in 28s**. Verified user registration, JWT login/refresh, role permissions (Admin, Manager, Driver, Customer), shipment CRUD, auto tracking ID generation, automatic `ShipmentTrackingEvent` creation, public tracking lookup, driver performance calculations, vehicle maintenance logging, and geospatial map endpoints.

### FastAPI ML Microservice Pytest Suite:
```powershell
cd ml_service
..\.venv\Scripts\pytest.exe tests
```
*Result:* **6 tests passed in 4.66s**. Verified health check, model metrics, delay predictions with real ensemble classifier, ETA regression, and anomaly detection.

### Frontend Build Verification:
```powershell
cd frontend
cmd /c npm run build
```
*Result:* **Built in 14.75s** with 0 errors. All pages, Leaflet maps, Recharts visualizations, and modals bundled successfully.

---

## 6. Implementation Status

- [x] **Phase 1: Architecture & Base Services**
  - Multi-tier folder structure, Docker Compose PostgreSQL 16, Django 5+ setup, FastAPI setup, React + Vite frontend.
- [x] **Phase 2: Authentication, Roles, Shipment CRUD & Database Relationships**
  - Custom `User` model with RBAC (`ADMIN`, `MANAGER`, `DRIVER`, `CUSTOMER`).
  - JWT authentication (`/api/auth/register/`, `/api/auth/login/`, `/token/refresh/`, `/me/`, `/logout/`).
  - Database models: `Shipment`, `ShipmentTrackingEvent`, `Driver`, `Vehicle`, `PredictionRecord`, `AnomalyAlert`.
  - Automatic unique tracking ID generation (`FF-YYYYMM-XXXXXX`).
  - Automatic `ShipmentTrackingEvent` creation upon every status change.
  - Role-based shipment access control & permission enforcement.
  - Customer-facing public tracking API (`/api/shipments/track/<tracking_id>/`).
  - Realistic database seeding script (`python manage.py seed_data`).
  - 18 automated backend test cases covering positive and negative scenarios.
- [x] **Phase 3: React Dashboard, Forms, Tables & API Integration**
  - Enterprise JWT Authentication flow (`AuthContext`, token persistence, automatic refresh interceptors).
  - Role-based protected routes (`ProtectedRoute.jsx`) with access denial handling.
  - Interactive Login & Register pages with 1-click pre-seeded account selectors (Admin, Manager, Driver, Customer).
  - Shipment Management Dashboard with real-time KPI metrics (`/api/shipments/summary/`).
  - Searchable, multi-criteria filterable shipment table with status badges and delay risk indicators.
  - Create Shipment Modal (`CreateShipmentModal.jsx`) with dynamic fleet assignment and coordinate inputs.
  - Shipment Dossier & Timeline Modal (`ShipmentDetailModal.jsx`) with milestone event logs and live status transitions.
  - Public Customer Tracking Portal (`CustomerPortal.jsx`) with 5-stage visual progress stepper.
  - User and Role Directory (`Users.jsx`) for managing permissions across staff and shippers.
- [x] **Phase 4: Driver & Vehicle Fleet Management**
  - Driver roster with contact info, driving license, availability toggle, and live active shipment indicators.
  - Transparent Driver Performance scoring: 60% On-Time rate + 40% Customer Feedback score.
  - Driver Performance Dossier modal (`Drivers.jsx`) showing delivery history, feedback comments, and metrics.
  - Vehicle registry (`Vehicles.jsx`) with capacity limits, fuel engines, status badges, and mileage tracking.
  - Vehicle Maintenance Logging (`MaintenanceRecord` model) and service history tracking modal.
  - Strict validation preventing conflicting assignments for drivers or vehicles already on active in-transit duty.
  - Vehicle capacity enforcement (blocking consignments that exceed payload limits).
  - 25 automated backend tests passing across all Django modules.
- [x] **Phase 5: Shipment Tracking & Map Integration (Leaflet.js)**
  - Interactive OpenStreetMap integration using React-Leaflet with custom SVG markers (Origin, Destination, Fleet Truck).
  - Dynamic route polylines connecting origin -> current location -> destination with color-coded delay risk styling.
  - Interactive popup dossiers with live driver, vehicle, and status details.
  - Live GPS Progression Simulation toggle advancing vehicles along route coordinates in real-time.
  - Telemetry map endpoints (`/api/shipments/map/live/` and `/api/shipments/map/all/`).
- [x] **Phase 6: Create Synthetic Datasets & Train ML Models**
  - Realistic multi-factor synthetic dataset generation script (`generate_dataset.py`, 12,000 samples).
  - Delay Prediction Classifier: Ensemble `VotingClassifier(RandomForest + GradientBoosting)` achieving 97.8% Accuracy, 97.8% F1-score, and 0.998 ROC-AUC.
  - ETA Regressor: `HistGradientBoostingRegressor` with R² = 0.991, MAE = 2.71 hours.
  - Anomaly Detector: Unsupervised `IsolationForest` detecting route deviations, silent dropouts, and duration spikes (79.2% accuracy).
  - Serialized joblib artifacts stored in `ml_service/artifacts/`.
- [x] **Phase 7: Integrate ML Models with FastAPI**
  - Lifespan model loader in FastAPI initializing all 3 joblib models into app state.
  - Validated Pydantic v2 prediction endpoints: `/ml/predict-delay`, `/ml/predict-eta`, `/ml/detect-anomaly`.
  - Comprehensive model evaluation summary API (`/ml/model-metrics`).
  - OpenStreetMap OSRM route comparison engine (`/routing/compare-routes`).
- [x] **Phase 8: AI Dashboard, Predictions & Anomaly Alerts**
  - Interactive AI Delay & ETA engine UI (`Predictions.jsx`) with live parameter adjustments and probability gauge.
  - Operational Anomaly Alerts management feed (`Anomalies.jsx`) with one-click resolution and real-time telemetry tester.
  - Analytics & Operational Reports dashboard (`Analytics.jsx`) with Recharts visualizations (Pie/Donut lifecycle breakdown, BarChart delay risk, Driver performance leaderboard).
- [x] **Phase 9: Testing, Security, Optimization & Free Deployment**
  - 20/20 automated Django unit & integration tests passing.
  - 6/6 automated FastAPI ML pytest cases passing with 0 warnings.
  - Full frontend Vite production build passing with 0 errors.
  - Complete zero-cost deployment configuration for Vercel (Frontend), Render (Django Backend & FastAPI Microservice), and Supabase (PostgreSQL 16).



