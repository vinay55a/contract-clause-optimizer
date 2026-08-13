# Railway Deployment Configuration

## Project Structure
This project contains:
- **Frontend**: React + Vite (served on Railway)
- **Backend**: FastAPI Python application (served on Railway)
- **Database**: PostgreSQL (recommended)

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://your-backend-railway-url.railway.app
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@db:5432/contracts
GEMINI_API_KEY=your-gemini-api-key
SECRET_KEY=your-secret-key
```

## How to Deploy on Railway

### Option 1: Using Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Connect to your project
railway link

# Deploy
railway up
```

### Option 2: Using Railway Dashboard
1. Go to railway.app
2. Create a new project
3. Add services (Frontend, Backend, Database)
4. Connect to GitHub repository
5. Configure environment variables
6. Deploy

## Services Configuration

### Frontend Service
- **Builder**: Dockerfile
- **Port**: $PORT (auto-assigned by Railway)
- **Start Command**: Automatic (from Dockerfile)
- **Health Check**: /

### Backend Service
- **Builder**: Dockerfile
- **Port**: $PORT (auto-assigned by Railway)
- **Start Command**: Automatic (from Dockerfile)
- **Health Check**: /docs

### Database Service
- **Type**: PostgreSQL
- **Version**: Latest
- **Database Name**: contracts

## Deployment Files

All necessary Railway deployment files have been created:

### Frontend Files
- `frontend/Dockerfile` - Multi-stage build for production
- `frontend/railway.json` - Railway configuration
- `frontend/.railway.toml` - Alternative TOML configuration
- `frontend/.railwayignore` - Files to exclude from build
- `frontend/.env` - Environment variables

### Backend Files
- `backend/Dockerfile` - Production-ready Python image
- `backend/railway.json` - Railway configuration
- `backend/.railway.toml` - Alternative TOML configuration
- `backend/.railwayignore` - Files to exclude from build
