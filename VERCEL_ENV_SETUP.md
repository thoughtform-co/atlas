# Adding Environment Variables to Vercel

## Quick Steps

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your **Atlas** project

### 2. Navigate to Settings
- Click on your project name
- Click **"Settings"** in the top navigation
- Click **"Environment Variables"** in the left sidebar

### 3. Add Replicate Variables

Add these two environment variables:

#### Variable 1: `REPLICATE_API_TOKEN`
- **Name**: `REPLICATE_API_TOKEN`
- **Value**: `r8_your-token-here` (your actual token)
- **Environment**: Select all three:
  - ☑️ Production
  - ☑️ Preview
  - ☑️ Development
- Click **"Save"**

#### Variable 2: `NEXT_PUBLIC_APP_URL`
- **Name**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://your-project-name.vercel.app` (your Vercel deployment URL)
  - Or your custom domain if you have one: `https://atlas.thoughtform.co`
- **Environment**: Select all three:
  - ☑️ Production
  - ☑️ Preview
  - ☑️ Development
- Click **"Save"**

### 4. Redeploy

After adding the variables, you need to redeploy:

**Option A: Automatic (Recommended)**
- Vercel will automatically redeploy on your next git push
- Or trigger a redeploy manually:
  - Go to **"Deployments"** tab
  - Click the **"..."** menu on the latest deployment
  - Click **"Redeploy"**

**Option B: Manual Trigger**
- Push any commit to trigger a new deployment:
  ```bash
  git commit --allow-empty -m "Trigger Vercel redeploy with new env vars"
  git push
  ```

## Complete Environment Variables Checklist

Make sure you have ALL these variables in Vercel:

### Required for Supabase
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### Required for Forge (Replicate)
- ✅ `REPLICATE_API_TOKEN`
- ✅ `NEXT_PUBLIC_APP_URL`

### Optional (if you use these features)
- `ANTHROPIC_API_KEY` (Claude)
- `GOOGLE_GEMINI_API_KEY` (Gemini)
- `VOYAGE_API_KEY` (Embeddings)

## Finding Your Vercel URL

1. Go to your project in Vercel dashboard
2. Click on **"Settings"** → **"Domains"**
3. You'll see your deployment URL (e.g., `atlas-xyz123.vercel.app`)
4. Or use your custom domain if configured

## Verification

After redeploying, verify it works:

1. **Check the deployment logs:**
   - Go to **"Deployments"** tab
   - Click on the latest deployment
   - Check for any errors related to missing environment variables

2. **Test the Forge feature:**
   - Go to `/forge` on your production site
   - Try generating a video
   - Check browser console and Vercel function logs for errors

3. **Check webhook endpoint:**
   - The webhook URL should be: `https://your-domain.vercel.app/api/forge/webhook`
   - Replicate will call this when videos complete

## Troubleshooting

### "REPLICATE_API_TOKEN is not configured" in production
- Make sure you added the variable to **Production** environment (not just Development)
- Redeploy after adding the variable
- Check that the variable name is exactly `REPLICATE_API_TOKEN` (case-sensitive)

### Webhooks not working
- Verify `NEXT_PUBLIC_APP_URL` is set to your production URL (not localhost)
- Make sure the URL is publicly accessible
- Check Vercel function logs for webhook errors

### Variables not updating
- Environment variables are only loaded at build time
- You MUST redeploy after adding/changing variables
- Changes don't take effect until the next deployment

## Security Notes

- ✅ `REPLICATE_API_TOKEN` is server-side only (not exposed to client)
- ✅ `NEXT_PUBLIC_APP_URL` is safe to expose (it's public anyway)
- ⚠️ Never commit `.env.local` to git (it's in `.gitignore`)
- ✅ Vercel encrypts environment variables at rest

## Quick Reference

**Vercel Dashboard**: https://vercel.com/dashboard  
**Environment Variables**: Settings → Environment Variables  
**Deployments**: Deployments tab → Redeploy
