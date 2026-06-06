# Douglas Real Estate Systems - Backend

FastAPI backend for the real estate operations platform.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000
API docs at http://localhost:8000/docs
