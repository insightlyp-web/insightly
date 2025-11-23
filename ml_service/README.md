# CampusAI ML Service

FastAPI microservice for AI/ML features in CampusAI.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Download spaCy model:
```bash
python -m spacy download en_core_web_sm
```

If that doesn't work, install directly:
```bash
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl
```

3. Run the service:
```bash
python app.py
```

Or with uvicorn:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- `POST /ai/resume/parse` - Parse PDF resume
- `POST /ai/skills/gap` - Analyze skill gap
- `POST /ai/recommend/placements` - Get placement recommendations
- `POST /ai/attendance/anomaly` - Detect attendance anomalies
- `POST /ai/risk/predict` - Predict at-risk students
- `GET /health` - Health check

## Environment Variables

- `ML_SERVICE_PORT` - Port to run on (default: 8000)

