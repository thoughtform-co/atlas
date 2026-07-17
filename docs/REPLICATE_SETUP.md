# Replicate API Setup Guide

## Overview

The Forge feature uses Replicate's Wan 2.5 i2v model to generate videos from images. This guide will help you set up your Replicate API credentials.

## Step 1: Get Your Replicate API Token

1. **Sign up / Log in to Replicate:**
   - Go to https://replicate.com
   - Sign up for an account (or log in if you already have one)

2. **Get your API token:**
   - Go to https://replicate.com/account/api-tokens
   - Click "Create token" or copy your existing token
   - The token will look like: `r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **Add funds (if needed):**
   - Replicate charges per prediction based on GPU usage
   - Go to https://replicate.com/account/billing
   - Add credits to your account
   - Video generation typically costs ~$0.02 per second of generation time

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Replicate API Token (from https://replicate.com/account/api-tokens)
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App URL for webhooks (needed for Replicate to notify us when generation completes)
# For local development:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production (Vercel):
# NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Step 3: Verify Setup

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test the integration:**
   - Go to the Forge page in your app
   - Try generating a video from an image
   - Check the browser console and server logs for any errors

## Step 4: Configure Webhooks (Production)

For production deployments, you need to ensure Replicate can reach your webhook endpoint:

1. **Set `NEXT_PUBLIC_APP_URL` in Vercel:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add `NEXT_PUBLIC_APP_URL` with your production URL (e.g., `https://atlas.thoughtform.co`)

2. **Verify webhook endpoint is accessible:**
   - The webhook endpoint is: `POST /api/forge/webhook`
   - Replicate will send POST requests here when predictions complete
   - Make sure your production URL is publicly accessible

## Environment Variables Summary

Here's a complete list of environment variables needed for Forge:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For webhooks

# Replicate (required for Forge)
REPLICATE_API_TOKEN=r8_...

# App URL (required for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app  # Production
```

## How It Works

1. **User initiates generation:**
   - User uploads an image and enters a prompt on the Forge page
   - Frontend calls `POST /api/forge/generate`

2. **API creates generation record:**
   - Creates a record in `forge_generations` table with status `pending`
   - Calls Replicate API to start video generation
   - Updates status to `processing` and stores `replicate_prediction_id`

3. **Replicate processes the video:**
   - Replicate runs the Wan 2.5 i2v model
   - This typically takes 30-60 seconds for a 5-second video

4. **Webhook notification:**
   - When complete, Replicate sends a webhook to `/api/forge/webhook`
   - Webhook handler updates the generation record with:
     - Video URL
     - Thumbnail URL
     - Status (`completed` or `failed`)
     - Cost in cents
   - Creates a record in `forge_costs` table for billing tracking

5. **Frontend polls for updates:**
   - Frontend periodically checks generation status
   - When status is `completed`, displays the video

## Cost Estimation

- **Approximate cost:** ~$0.02 per second of generation time
- **5-second video:** ~$1.00 (50 seconds generation time)
- **10-second video:** ~$2.00 (100 seconds generation time)

Costs are tracked in the `forge_costs` table and displayed in the Forge cost ticker.

## Troubleshooting

### "REPLICATE_API_TOKEN is not configured"
- Make sure you've added `REPLICATE_API_TOKEN` to your `.env.local` file
- Restart your dev server after adding the variable

### "Replicate API error: 401"
- Your API token is invalid or expired
- Get a new token from https://replicate.com/account/api-tokens

### "Replicate API error: 402"
- Your account has insufficient credits
- Add funds at https://replicate.com/account/billing

### Webhooks not working
- Check that `NEXT_PUBLIC_APP_URL` is set correctly
- Verify the webhook URL is publicly accessible (not localhost in production)
- Check Vercel function logs for webhook errors

### Video generation fails
- Check Replicate model status: https://replicate.com/wan-video/wan-2.5-i2v
- Verify your image URL is accessible (must be public URL or base64 data URI)
- Check prompt length and content (some prompts may be rejected)

## Additional Resources

- **Replicate Docs:** https://replicate.com/docs
- **Wan 2.5 i2v Model:** https://replicate.com/wan-video/wan-2.5-i2v
- **Replicate Dashboard:** https://replicate.com/account
- **API Reference:** https://replicate.com/docs/reference/http
