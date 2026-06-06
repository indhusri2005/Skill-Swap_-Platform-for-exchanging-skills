# 🚀 Complete Deployment Guide - SkillSwap MERN Platform

## Project Structure
Your project is a **monorepo** with:
- **Frontend**: React + TypeScript (in `src/`)
- **Backend**: Node.js + Express + MongoDB (in `server/`)

---

## ✅ Phase 0: Verification (Already Done ✓)

Your codebase is properly configured:
- ✓ Backend uses `dotenv` for environment variables
- ✓ CORS configured with `process.env.CLIENT_URL`
- ✓ MongoDB connection uses `process.env.MONGODB_URI`
- ✓ Frontend uses Vite environment variables (`VITE_API_URL`)
- ✓ `.gitignore` includes `.env` to protect secrets
- ✓ `package.json` has proper start scripts

---

## 🛠️ Phase 1: Local Testing (Before Deployment)

Before pushing to the cloud, test your setup locally:

### 1. Test Backend Connection to MongoDB Atlas
```bash
cd server
npm install  # if needed
npm start
```

You should see:
```
✅ Connected to MongoDB
Database: mongodb+srv://indhusrivishwa_db_user:...
Server is running on port 5000
```

### 2. Test Frontend Connection to Backend
```bash
# In root directory
npm install  # if needed
npm run dev
```

Visit http://localhost:5173 and check browser console for no API errors.

### 3. Verify Environment Variables Are Not in Git
```bash
git status
```

You should **NOT** see `.env` files listed. If you do, run:
```bash
git rm --cached .env server/.env
git commit -m "Remove .env files from tracking"
```

---

## 📦 Phase 2: Push Code to GitHub

### 1. Create GitHub Repository
1. Go to [GitHub.com](https://github.com/)
2. Click **New** → **New repository**
3. Name it: `skill-swap-platform` (or similar)
4. Choose **Private** (recommended for security)
5. Click **Create repository**

### 2. Push Your Code
Run these commands in your project root:

```bash
git init
git add .
git commit -m "Initial commit: MERN stack with MongoDB Atlas integration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/skill-swap-platform.git
git push -u origin main
```

✅ Your code is now safely backed up in the cloud and hidden from the public!

---

## ☁️ Phase 3: Deploy Backend on Render

### 1. Sign Up on Render
- Go to [render.com](https://render.com/)
- Click **Sign up with GitHub**
- Grant access to your repositories

### 2. Deploy the Backend
1. Click **New +** button → **Web Service**
2. Connect your `skill-swap-platform` repository
3. Fill in these details:

| Field | Value |
|-------|-------|
| **Name** | `skill-swap-api` |
| **Environment** | `Node` |
| **Build Command** | `cd server && npm install` |
| **Start Command** | `cd server && npm start` |
| **Root Directory** | `.` (leave blank) |

4. Scroll to **Advanced** → Click it
5. Add these Environment Variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://indhusrivishwa_db_user:keTqFanCGuApA3kK@cluster0.hekqwcv.mongodb.net/SkillSwap?appName=Cluster0` |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | *(leave blank for now, update after frontend deploys)* |
| `JWT_SECRET` | *(change this! create a strong random string)* |

6. Click **Create Web Service**

⏳ **Wait 3-5 minutes** for the build and deployment.

### 3. Get Your Live Backend URL
Once it says **"Your service is live"**, copy the URL shown at the top (e.g., `https://skill-swap-api.onrender.com`).

✅ Your backend is now live!

---

## 🎨 Phase 4: Deploy Frontend on Vercel

### 1. Sign Up on Vercel
- Go to [vercel.com](https://vercel.com/)
- Click **Sign up with GitHub**
- Grant access to your repositories

### 2. Deploy the Frontend
1. Click **Add New...** → **Project**
2. Find and click **Import** next to your `skill-swap-platform` repo
3. In **Root Directory**, set it to: `.` (current directory)
4. In **Build and Output Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Scroll to **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://skill-swap-api.onrender.com` *(your Render backend URL)* |

6. Click **Deploy**

⏳ **Wait 1-2 minutes** for build.

### 3. Get Your Live Frontend URL
Once deployment completes, you'll see a URL like:
```
https://skill-swap-platform.vercel.app
```

✅ Your frontend is now live!

---

## 🔄 Phase 5: Update Backend for Frontend URL

Now that your frontend is deployed, update your backend's CORS configuration:

### 1. Go Back to Render Dashboard
1. Click on your `skill-swap-api` service
2. Go to **Environment** tab
3. Edit `CLIENT_URL` and set it to your Vercel URL:
   ```
   https://skill-swap-platform.vercel.app
   ```
4. Click **Save Changes**

Render will automatically redeploy with the new settings.

✅ Frontend and backend can now communicate securely!

---

## 🧪 Phase 6: Test Your Live Application

1. Visit your Vercel URL: `https://skill-swap-platform.vercel.app`
2. Test these features:
   - **Register** a new account
   - **Login** with your new account
   - **Browse skills** (should load from live database)
   - **Create a skill post** (should save to MongoDB Atlas)
   - Check browser **Developer Tools → Console** for any errors

### Troubleshooting Common Issues

| Issue | Solution |
|-------|----------|
| **CORS Error** | Check that `CLIENT_URL` in Render backend matches your Vercel URL |
| **API calls fail** | Verify `VITE_API_URL` in Vercel matches your Render backend URL |
| **Database connection fails** | Check MongoDB Atlas allows Render's IP (should auto-allow) |
| **Build fails on Vercel** | Check the build logs - ensure frontend builds correctly |

---

## 📱 Phase 7: Update Your Domain (Optional)

Want a custom domain like `skillswap.com`?

### Vercel Custom Domain
1. In Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Update your DNS settings with the provided CNAME

### Render Custom Domain
1. In Render dashboard, go to your service
2. Click **Settings** → **Custom Domain**
3. Add your custom domain
4. Update your DNS settings

---

## 🔐 Security Checklist

- ✅ `.env` files are in `.gitignore`
- ✅ MongoDB credentials are in environment variables (not in code)
- ✅ JWT_SECRET is strong and unique
- ✅ CORS is properly configured
- ✅ Rate limiting is enabled on backend
- ✅ Helmet is enabled for security headers
- ✅ Your GitHub repository is private

---

## 📊 Monitoring Your Live App

### View Logs
- **Backend logs**: Render dashboard → your service → Logs
- **Frontend logs**: Vercel dashboard → your project → Deployments → View logs

### Performance
- **Render**: Monitor resource usage in Settings → Resource Metrics
- **Vercel**: Check Core Web Vitals in Analytics tab

---

## 🚀 Future Updates

Whenever you make changes to your code:

```bash
# Make your changes locally
git add .
git commit -m "Describe your changes"
git push origin main
```

Both Render and Vercel automatically detect the push and redeploy!

---

## 📞 Need Help?

- **Render Support**: https://render.com/support
- **Vercel Support**: https://vercel.com/support
- **MongoDB Atlas Support**: https://www.mongodb.com/support

Congratulations! Your SkillSwap platform is now live on the internet! 🎉
