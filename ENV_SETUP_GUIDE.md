# ChemViz Pro - Environment Configuration Guide

## Files Created

### 1. Backend Environment File: `/final_submission/.env`
```
MONGODB_URI=mongodb+srv://tanay:yOxMelUKO8j3UQAT@theostasis.5lmt65b.mongodb.net/chemviz?appName=TheoStasis&retryWrites=true&w=majority
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
SECRET_KEY=your-secret-key-here-change-in-production
```

### 2. Frontend Environment File: `/frontend/.env`
```
VITE_API_BASE_URL=http://localhost:8000
```

## Files Updated

### 1. Backend Settings (`/core/settings.py`)
- Added imports: `import os`, `from dotenv import load_dotenv`
- Added `load_dotenv()` call at the top
- Updated `SECRET_KEY` to use `os.getenv('SECRET_KEY', 'default')`
- Updated `DEBUG` to use `os.getenv('DEBUG', 'True') == 'True'`
- Updated `ALLOWED_HOSTS` to parse from `.env` with fallback to `'localhost,127.0.0.1,0.0.0.0'`
- Updated `MONGODB_URI` to use `os.getenv()` with fallback to original URI

### 2. Frontend App (`/frontend/src/App.jsx`)
Replaced 4 hardcoded API URLs:
- Line 103: `axios.get('http://127.0.0.1:8000/api/stats/')` → `axios.get(\`${import.meta.env.VITE_API_BASE_URL}/api/stats/\`)`
- Line 117: `axios.post('http://127.0.0.1:8000/api/stats/', ...)` → `axios.post(\`${import.meta.env.VITE_API_BASE_URL}/api/stats/\`, ...)`
- Line 132: `axios.get('http://127.0.0.1:8000/api/report/...')` → `axios.get(\`${import.meta.env.VITE_API_BASE_URL}/api/report/...\`)`
- Line 228: `axios.post('http://127.0.0.1:8000/api/...')` → `axios.post(\`${import.meta.env.VITE_API_BASE_URL}/api/...\`)`

### 3. Desktop App (`/desktop_app.py`)
- Added imports: `import os`, `from dotenv import load_dotenv`
- Added `load_dotenv()` call at the top
- Added `API_BASE_URL = os.getenv('VITE_API_BASE_URL', 'http://localhost:8000')`
- Replaced 4 hardcoded API URLs:
  - Line 94: Token endpoint
  - Line 107: Register endpoint
  - Line 286: Stats fetch endpoint
  - Line 401: File upload endpoint

## Deployment Configuration

### For Local Development (Current State)
Your `.env` files are already set up for local development:
- Backend runs on `http://localhost:8000`
- Frontend connects to this local backend
- Desktop app connects to same backend

### For Production Deployment on Vercel

**Step 1: Update `.env` when deploying backend**
```
MONGODB_URI=mongodb+srv://tanay:yOxMelUKO8j3UQAT@theostasis.5lmt65b.mongodb.net/chemviz?appName=TheoStasis&retryWrites=true&w=majority
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.com,your-vercel-app.vercel.app
SECRET_KEY=generate-new-secure-key-for-production
```

**Step 2: Update Vercel Environment Variables**
In Vercel project settings, add:
- `VITE_API_BASE_URL=https://your-backend-domain.com`

**Step 3: Update CORS in Backend (settings.py)**
After deployment, update CORS to specific domains instead of wildcard:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://your-app.vercel.app",
]
```

## Package Installed
- `python-dotenv==1.2.1` - For environment variable management

## Next Steps for Deployment
1. Choose backend deployment platform (Heroku, Railway, or PythonAnywhere)
2. Deploy backend and get production URL
3. Update frontend `.env` with production backend URL
4. Deploy to Vercel
5. Update backend CORS settings with Vercel domain
6. Redeploy backend with updated settings
