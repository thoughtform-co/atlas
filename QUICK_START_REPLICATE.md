# Quick Start: Replicate Integration

## 🚀 Get Started in 3 Steps

### 1. Get Your Replicate API Token
- Go to: https://replicate.com/account/api-tokens
- Click "Create token" or copy existing token
- Token format: `r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Add to `.env.local`
```bash
REPLICATE_API_TOKEN=r8_your-token-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Restart Dev Server
```bash
npm run dev
```

## ✅ That's It!

Your Forge feature is now ready to generate videos. Try it:
1. Go to `/forge` in your app
2. Upload an image
3. Enter a prompt
4. Click generate!

## 📋 Full Setup Guide

For detailed instructions, troubleshooting, and production setup, see:
- **[REPLICATE_SETUP.md](./REPLICATE_SETUP.md)** - Complete setup guide

## 💰 Cost Information

- **Approximate cost:** ~$0.02 per second of generation time
- **5-second video:** ~$1.00
- **10-second video:** ~$2.00

Add credits at: https://replicate.com/account/billing

## 🔗 Important Links

- **Replicate Dashboard:** https://replicate.com/account
- **API Tokens:** https://replicate.com/account/api-tokens
- **Billing:** https://replicate.com/account/billing
- **Wan 2.5 i2v Model:** https://replicate.com/wan-video/wan-2.5-i2v
