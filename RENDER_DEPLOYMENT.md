# Deploying Quantum Optical Communication Prototype to Render

This repository is pre-configured for deployment on **[Render](https://render.com/)**.

You can deploy using either:
1. **Method 1: Render Blueprint (Recommended)** – Provisions the FastAPI backend (Web Service) and React frontend (Static Site) automatically using `render.yaml`.
2. **Method 2: Unified Docker Web Service** – Single all-in-one container that hosts both backend API and React frontend on one domain with zero CORS or environment setup.
3. **Method 3: Manual Dashboard Setup** – Set up services individually via the Render dashboard.

---

## Method 1: Render Blueprint Deployment (Recommended)

Render Blueprints read [render.yaml](render.yaml) from your GitHub repository to configure both services automatically.

### Step 1: Push Code to GitHub / GitLab
Ensure your project is committed and pushed to a Git repository:
```bash
git add .
git commit -m "Configure Render Blueprint deployment and Docker setup"
git push origin main
```

### Step 2: Create a Blueprint on Render
1. Go to the **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** in the top right and select **Blueprint**.
3. Connect your Git repository (`quantum-prototype` or your repo name).
4. Render will read `render.yaml` and show the planned resources:
   - **`quantum-backend`** (Web Service – Python 3.11)
   - **`quantum-frontend`** (Static Site – Node / Vite)
5. Click **Apply**.

### Step 3: Link Backend URL to Frontend
1. Once `quantum-backend` finishes deploying, copy its live URL (e.g., `https://quantum-backend-xxxx.onrender.com`).
2. Go to the `quantum-frontend` service in the Render Dashboard.
3. Navigate to **Environment**.
4. Set or update `VITE_API_BASE_URL`:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://quantum-backend-xxxx.onrender.com` (your backend's actual URL, without trailing slash).
5. Click **Save Changes** (Render will trigger a quick redeploy with the new backend URL).
6. Open your `quantum-frontend` URL to access the application!

---

## Method 2: Unified Docker Web Service (Single Domain)

If you prefer having **one single URL** for both the frontend and backend (no separate domains, no CORS configuration):

1. In the **Render Dashboard**, click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Choose:
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile` (uses the root multi-stage Dockerfile)
   - **Instance Type**: `Free`
4. Click **Deploy Web Service**.
5. The container will build the React frontend with Node.js, prepare the Python environment with FastAPI and datasets, and launch the service.
6. The entire app (frontend UI + `/api/*` endpoints + Swagger docs at `/docs`) will be live on a single URL!

---

## Method 3: Manual Step-by-Step Setup

If you prefer to configure each service manually:

### 1. Deploy the Backend Web Service
- Click **New +** -> **Web Service**
- Connect your repository
- Configure:
  - **Name**: `quantum-backend`
  - **Runtime**: `Python 3`
  - **Build Command**: `pip install -r backend/requirements.txt`
  - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
  - **Plan**: `Free`
  - **Health Check Path**: `/api/health`
- Environment Variables:
  - `PYTHON_VERSION`: `3.11.0`
  - `PYTHONPATH`: `.`

### 2. Deploy the Frontend Static Site
- Click **New +** -> **Static Site**
- Connect your repository
- Configure:
  - **Name**: `quantum-frontend`
  - **Root Directory**: `frontend`
  - **Build Command**: `npm install && npm run build`
  - **Publish Directory**: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL`: `https://quantum-backend.onrender.com` (use your actual backend URL)
- Redirects / Rewrites:
  - Click **Redirects/Rewrites** -> **Add Rule**
  - **Type**: `Rewrite`
  - **Source**: `/*`
  - **Destination**: `/index.html`

---

## Verifying Deployment

Once deployed, you can verify both services:

| Check | URL | Expected Response |
|---|---|---|
| Backend Health | `https://<backend>.onrender.com/api/health` | `{"status":"healthy","service":"Quantum Communication Simulation API","version":"1.0.0"}` |
| API Docs | `https://<backend>.onrender.com/docs` | Interactive Swagger UI |
| Frontend App | `https://<frontend>.onrender.com/` | Quantum Optical Communication Web Dashboard |
| Simulation API | `POST https://<backend>.onrender.com/api/simulation/quantum` | Returns quantum simulation calculations |

---

## Free Tier Notes & Best Practices

- **Render Free Web Services Spin-Down**: Free tier web services go to sleep after 15 minutes of inactivity. The first request after sleep may take ~30–50 seconds to wake up (spin-up). Subsequent requests are instantaneous.
- **Render Static Sites**: Static Sites are on a global CDN and are **always awake and 100% free** with zero cold starts.
- **SQLite Database**: The local SQLite database stores run history. Free tier web service disks are ephemeral (reset on redeploy). For persistent storage across redeploys, you can connect an external PostgreSQL database (Render provides free PostgreSQL instances) if needed in the future.
