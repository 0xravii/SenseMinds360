# Vercel Deployment Guide for SenseMinds 360 PWA

## Prerequisites
- Vercel account (free tier available)
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js project ready for deployment

## Quick Deploy Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   cd sense-minds-360
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy? `Y`
   - Which scope? Select your account
   - Link to existing project? `N` (for first deployment)
   - Project name: `sense-minds-360` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings? `N` (vercel.json will handle configuration)

### Option 2: Deploy via Vercel Dashboard

1. **Push code to Git repository**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables** (if needed)
   - Add any required environment variables in Vercel dashboard
   - Example: `NEXT_PUBLIC_API_URL=http://34.28.155.240`

## Project Configuration

The project includes:
- ✅ `vercel.json` - Optimized Vercel configuration
- ✅ `next.config.js` - Next.js production settings
- ✅ PWA manifest and service worker
- ✅ API proxy configuration for external endpoints

## Post-Deployment

### 1. Verify PWA Features
- Test offline functionality
- Verify service worker registration
- Check manifest.json accessibility
- Test "Add to Home Screen" on mobile

### 2. Performance Optimization
- Monitor Core Web Vitals in Vercel Analytics
- Check Lighthouse scores
- Verify caching strategies

### 3. Custom Domain (Optional)
- Add custom domain in Vercel dashboard
- Configure DNS settings
- SSL certificate is automatically provided

## Troubleshooting

### Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

### API Issues
- Check CORS configuration on external API
- Verify API endpoints in `vercel.json` rewrites
- Test API connectivity from Vercel's edge locations

### PWA Issues
- Ensure service worker is accessible at `/sw.js`
- Check manifest.json MIME type
- Verify HTTPS is enabled (required for PWA)

## Environment Variables

For production deployment, set these environment variables in Vercel:

```bash
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_REALTIME_WS_URL=wss://34.121.143.178:5000
NEXT_PUBLIC_API_MOCK_MODE=false
NODE_ENV=production
```

**Important Notes:**
- `NEXT_PUBLIC_API_URL` is set to `/api` to use Vercel's proxy configuration
- `NEXT_PUBLIC_REALTIME_WS_URL` uses secure WebSocket (wss://) for HTTPS compatibility
- The proxy configuration in `vercel.json` handles routing to the external API

## Deployment Commands

```bash
# Production deployment
vercel --prod

# Preview deployment
vercel

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]
```

## Success Indicators

✅ Build completes without errors  
✅ PWA manifest loads correctly  
✅ Service worker registers successfully  
✅ App works offline  
✅ Mobile installation prompt appears  
✅ API endpoints respond correctly  

Your SenseMinds 360 PWA is now ready for production deployment on Vercel!