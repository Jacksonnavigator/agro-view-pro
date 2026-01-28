# Agro View Pro - Render Deployment Guide

Complete guide for deploying the Agro View Pro IoT soil monitoring application to Render.

## Prerequisites

- GitHub repository with your code
- Render account ([sign up free](https://render.com))
- Firebase project credentials

## Quick Start

### 1. Prepare Your Repository

Ensure your latest changes are pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Web Service on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `agro-view-pro` repository

### 3. Configure Build Settings

| Setting | Value |
|---------|-------|
| **Name** | `agro-view-pro` (or your preferred name) |
| **Environment** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |
| **Branch** | `main` |

### 4. Add Environment Variables

In the **Environment** section, add the following variables:

> [!IMPORTANT]
> These values are from your Firebase Console. Get them from: **Project Settings** → **General** → **Your apps** → **SDK setup and configuration**

| Variable Name | Example Value | Description |
|--------------|---------------|-------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyBNCtfOzG2Iv8bvCnzpIndVgNQrnxRh2Hc` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `soilg-c17f2.firebaseapp.com` | Firebase Auth Domain |
| `VITE_FIREBASE_DATABASE_URL` | `https://soilg-c17f2-default-rtdb.firebaseio.com` | Realtime Database URL |
| `VITE_FIREBASE_PROJECT_ID` | `soilg-c17f2` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `soilg-c17f2.firebasestorage.app` | Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `675059237959` | Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:675059237959:web:e6cddb869dba1ba8ed9d62` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-R92HDXKQKS` | Analytics Measurement ID (Optional) |

**How to add variables:**
1. Click **"Add Environment Variable"**
2. Enter the **Key** (variable name)
3. Enter the **Value** (your Firebase credential)
4. Repeat for all variables

### 5. Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy to a `.onrender.com` URL

### 6. Monitor Deployment

- Watch the **Logs** tab for build progress
- First deployment takes 2-5 minutes
- You'll see: `Build successful 🎉` when complete

### 7. Access Your Application

Your app will be available at:
```
https://agro-view-pro.onrender.com
```
(Replace with your actual service name)

---

## Local Development Setup

After cloning the repository, you need to set up environment variables locally:

### 1. Create `.env` file

```bash
cp .env.example .env
```

### 2. Edit `.env` with your Firebase credentials

Open `.env` and replace the placeholder values with your actual Firebase credentials.

### 3. Start development server

```bash
npm install
npm run dev
```

---

## Advanced Configuration

### Custom Domain

1. Go to **Settings** → **Custom Domain**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records as instructed by Render

### Auto-Deploy

Render automatically deploys when you push to your connected branch:

```bash
git push origin main  # Triggers automatic deployment
```

To disable auto-deploy:
1. Go to **Settings** → **Build & Deploy**
2. Toggle **"Auto-Deploy"** off

### Health Checks

Render automatically monitors your app. To customize:

1. Go to **Settings** → **Health & Alerts**
2. Configure health check path (default: `/`)
3. Set up notification preferences

---

## Troubleshooting

### Build Fails with "Missing environment variables"

**Problem:** Firebase environment variables not set

**Solution:**
1. Go to **Environment** tab
2. Verify all 8 `VITE_FIREBASE_*` variables are present
3. Check for typos in variable names
4. Redeploy: **Manual Deploy** → **Deploy latest commit**

### App Shows Blank Page

**Problem:** Routing issue with SPA

**Solution:** Add redirect rules for client-side routing

Create `public/_redirects` file:
```
/*    /index.html   200
```

Then redeploy.

### Firebase Connection Errors

**Problem:** Invalid Firebase credentials

**Solution:**
1. Verify credentials in Firebase Console
2. Check Database URL includes `https://` and `-default-rtdb.firebaseio.com`
3. Ensure Firebase Realtime Database is enabled
4. Check Firebase security rules allow read/write access

### Build Takes Too Long / Times Out

**Problem:** Large dependencies or slow build

**Solution:**
1. Check build logs for specific errors
2. Ensure `package.json` doesn't have unnecessary dependencies
3. Consider upgrading Render plan for faster builds

### Environment Variables Not Updating

**Problem:** Cached build using old values

**Solution:**
1. Update environment variables
2. Go to **Manual Deploy**
3. Click **"Clear build cache & deploy"**

---

## Performance Optimization

### Enable Compression

Render automatically serves files with gzip compression.

### CDN & Caching

Render includes CDN caching for static assets. Your `dist` folder is automatically optimized.

### Monitor Performance

1. Go to **Metrics** tab
2. Monitor:
   - Response times
   - Memory usage
   - CPU usage
   - Request volume

---

## Security Best Practices

> [!CAUTION]
> **Never commit `.env` files to Git!** They contain sensitive credentials.

✅ **Do:**
- Use environment variables for all secrets
- Keep `.env.example` updated as a template
- Regularly rotate Firebase credentials
- Enable Firebase security rules

❌ **Don't:**
- Hardcode credentials in source code
- Commit `.env` files
- Share credentials in public channels
- Use production credentials in development

---

## Updating Your Application

### Standard Update Process

```bash
# 1. Make changes locally
git add .
git commit -m "Update feature X"

# 2. Push to GitHub (triggers auto-deploy)
git push origin main

# 3. Monitor deployment in Render dashboard
```

### Rollback to Previous Version

1. Go to **Events** tab
2. Find the successful deployment you want to restore
3. Click **"Rollback to this version"**

---

## Cost Considerations

### Free Tier Limitations

- Apps spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (sufficient for 1 service)

### Upgrading

For production use, consider:
- **Starter Plan** ($7/month): No spin-down, faster builds
- **Standard Plan** ($25/month): More resources, better performance

---

## Support & Resources

- **Render Documentation**: https://render.com/docs
- **Firebase Documentation**: https://firebase.google.com/docs
- **Vite Documentation**: https://vitejs.dev/guide/

---

## Deployment Checklist

- [ ] Environment variables configured in Render
- [ ] Build command set to `npm install && npm run build`
- [ ] Publish directory set to `dist`
- [ ] Auto-deploy enabled
- [ ] Firebase Realtime Database enabled
- [ ] Firebase security rules configured
- [ ] Custom domain configured (optional)
- [ ] Health checks verified
- [ ] Application tested in production

---

**Deployment Date:** _[Add date when deployed]_  
**Deployed URL:** _[Add your Render URL]_  
**Status:** ✅ Live | 🚧 In Progress | ❌ Issues
