# Deployment Guide - Cloudflare Pages

This guide explains how to deploy Abyssal Hunter to Cloudflare Pages.

## Prerequisites

- A Cloudflare account (free tier works fine)
- GitHub repository with your code
- Node.js installed locally for testing

## Automatic Deployment via GitHub

### 1. Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the left sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize Cloudflare to access your GitHub account
6. Select your repository: `abyssal-hunter`

### 2. Configure Build Settings

Cloudflare will auto-detect Vite, but verify these settings:

- **Production branch**: `main` or `master`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)
- **Node version**: `18` or `20`

### 3. Environment Variables (Optional)

If you need environment variables:

- Click **Environment variables**
- Add any `VITE_` prefixed variables

### 4. Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete (~1-2 minutes)
3. Your site will be live at: `https://abyssal-hunter-xxx.pages.dev`

## Custom Domain (Optional)

1. In your Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `abyssal-hunter.com`)
4. Follow the DNS configuration instructions
5. Wait for SSL certificate provisioning (~5 minutes)

## Manual Deployment via Wrangler CLI

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Deploy

```bash
npm run build
wrangler pages deploy dist --project-name=abyssal-hunter
```

## Continuous Deployment

Every push to your main branch will automatically:

1. Trigger a build on Cloudflare Pages
2. Run your build command
3. Deploy the new version
4. Make it live (usually within 1-2 minutes)

### Preview Deployments

Every pull request automatically gets a preview URL:

- Format: `https://[hash].abyssal-hunter-xxx.pages.dev`
- Perfect for testing before merging

## Build Configuration

The following files configure Cloudflare Pages:

- **`wrangler.toml`**: Cloudflare Pages configuration
- **`public/_headers`**: Security and caching headers
- **`public/_redirects`**: SPA routing (redirects all routes to index.html)

## Performance Features

Cloudflare Pages automatically provides:

- ✅ Global CDN (300+ locations)
- ✅ Automatic SSL/HTTPS
- ✅ HTTP/2 and HTTP/3
- ✅ Brotli compression
- ✅ DDoS protection
- ✅ Unlimited bandwidth (free tier)
- ✅ Unlimited requests (free tier)

## Monitoring

View deployment status and analytics:

1. Go to your Cloudflare Pages project
2. Click **Analytics** to see traffic stats
3. Click **Deployments** to see build history

## Rollback

If a deployment breaks something:

1. Go to **Deployments**
2. Find a working deployment
3. Click **···** (three dots)
4. Click **Rollback to this deployment**

## Troubleshooting

### Build fails

- Check the build logs in Cloudflare Pages
- Ensure `npm run build` works locally
- Verify Node version compatibility

### 404 errors on routes

- Check that `public/_redirects` file exists
- Ensure it contains: `/*    /index.html   200`

### Assets not loading

- Check build output directory is set to `dist`
- Verify files are in `dist` folder after build
- Check browser console for errors

## Local Testing

Test the production build locally before deploying:

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

Then visit `http://localhost:4173` to test.

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
