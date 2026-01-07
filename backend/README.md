# Autotuner Backend

Quick setup and run instructions for the FastAPI backend.

Prerequisites
- Python 3.9+ recommended
- Optional: create and activate a virtual environment

Install dependencies

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# or cmd
.\.venv\Scripts\activate.bat

pip install -r requirements.txt
```

Run the server

Option A — use uvicorn directly from the `backend` folder:

```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Option B — run the module script (added run guard):

```bash
python backend/main.py
```

The API exposes POST `/tune` which accepts an audio file and form fields `key`, `auto_key`, and `correction`.
