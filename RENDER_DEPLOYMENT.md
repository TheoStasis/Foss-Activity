# Deploy Django Backend on Render - Step by Step

## Step 1: Prepare Your Code for Render

### Clean requirements.txt is Ready ✅
The file has been cleaned to remove Windows-specific packages like `pywin32` and incompatible versions. Only necessary production packages are included:
- Django, DRF, JWT, CORS, MongoEngine, Pandas, ReportLab, python-dotenv, Gunicorn

### Add runtime.txt (Python version) ✅
File already created with `python-3.12.1` (stable version with excellent package support)

### Update settings.py for Production ✅
Already configured with:
- `DEBUG = os.getenv('DEBUG', 'False') == 'True'`
- `ALLOWED_HOSTS` from environment variables
- `CORS_ALLOWED_ORIGINS` with localhost and frontend URL
- Static files configuration for production

### Procfile Created ✅
Automatically runs `gunicorn core.wsgi:application`

---

## Step 2: Create Render Account & Push Code to GitHub

1. Go to [render.com](https://render.com)
2. Sign up with GitHub (easiest option)
3. Push your code to GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Step 3: Create Web Service on Render

1. After logging in to Render, click **"New +"** in top-right
2. Select **"Web Service"**
3. Select **"Deploy from a Git repository"**
4. Click **"Connect"** and authorize Render to access your GitHub
5. Select your repository (the FOSS folder one)
6. Choose branch: `main`
7. Fill in the details:
   - **Name**: `chemviz-backend` (or any name)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn core.wsgi:application`

---

## Step 4: Add Environment Variables

1. Scroll down to **"Environment"** section
2. Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://tanay:yOxMelUKO8j3UQAT@theostasis.5lmt65b.mongodb.net/chemviz?appName=TheoStasis&retryWrites=true&w=majority` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-render-domain.onrender.com` |
| `SECRET_KEY` | Generate a new strong key (see below) |
| `FRONTEND_URL` | Leave blank for now (update after Vercel deployment) |

### Generate a Secret Key
Open Python and run:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Copy that long string and paste it as `SECRET_KEY`

---

## Step 5: Configure Other Settings

1. **Instance Type**: Free (for testing) or paid if you want better performance
2. **Auto-deploy**: Keep `ON` so it redeploys when you push to GitHub
3. Make sure it says your Python version is correct

---

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (takes 2-5 minutes)
3. You'll see logs scrolling - wait until it says **"Service is live"**
4. Your backend URL will be something like: `https://chemviz-backend.onrender.com`

---

## Step 7: Test Your Backend is Running

Copy your Render URL (e.g., `https://chemviz-backend.onrender.com`) and test these:

1. **Health Check**: Visit `https://your-render-domain.onrender.com/api/stats/` in browser
   - Should show an error or redirect to login (that's OK - means it's running)

2. **From Terminal**:
```bash
curl -X GET https://your-render-domain.onrender.com/api/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Step 8: Update Frontend for Production

### Update frontend/.env:
```
VITE_API_BASE_URL=https://your-render-domain.onrender.com
```

Replace `your-render-domain` with your actual Render URL (you can copy from Render dashboard)

### Update backend for Vercel CORS:

After you get your Vercel domain (after deploying frontend), update Render env variables:

1. Go back to Render dashboard
2. Click your web service
3. Go to **"Environment"**
4. Update `ALLOWED_HOSTS`:
```
your-render-domain.onrender.com,your-app.vercel.app
```

5. Update `FRONTEND_URL`:
```
https://your-app.vercel.app
```

6. Click **"Save Changes"** (will trigger redeploy)

---

## Step 9: Deploy Frontend to Vercel

Once backend is live on Render:

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your project
4. Select the `frontend` folder as root directory
5. Add environment variables:
   - `VITE_API_BASE_URL`: `https://your-render-domain.onrender.com`
6. Deploy

---

## Troubleshooting

### If build fails:
- Check Render logs carefully
- Make sure `requirements.txt` exists and has all packages
- Make sure `runtime.txt` exists
- Try deleting and redeploying from scratch

### If frontend can't reach backend:
- Check CORS settings in backend `settings.py`
- Make sure Vercel URL is in `ALLOWED_HOSTS`
- Check browser console (F12) for network errors

### MongoDB connection issues:
- Verify `MONGODB_URI` in Render env variables
- Check MongoDB Atlas whitelist includes Render IP (should be automatic)

---

## Your URLs After Deployment

- **Backend**: `https://chemviz-backend.onrender.com` (Render)
- **Frontend**: `https://your-app.vercel.app` (Vercel)
- **Database**: MongoDB Atlas (no changes needed)

That's it! Your app is live! 🚀
