# Setting Up Gemini API Key for Atlas

This guide helps you get a Gemini API key through Google Cloud Console when you don't have CLI permissions.

## Current Status

Your account (`vince@voidwalker.eu`) doesn't have CLI permissions to:
- Enable APIs
- Grant IAM roles
- Create API keys via command line

**Solution:** Use the Google Cloud Console UI instead.

## Step-by-Step: Get API Key via Console

### Option 1: Through Vertex AI / API Keys Console (Recommended)

1. **Go to APIs & Services → Credentials**
   - Direct link: https://console.cloud.google.com/apis/credentials?project=atlas
   - Or navigate: Google Cloud Console → APIs & Services → Credentials

2. **Click "+ CREATE CREDENTIALS"**

3. **Select "API Key"**

4. **Copy the generated key** (starts with `AIza...`)

5. **Optional: Restrict the key**
   - Click "RESTRICT KEY"
   - Under "API restrictions", select "Restrict key"
   - Choose "Vertex AI API" or "Generative Language API"
   - Click "SAVE"

### Option 2: Through Gemini Studio (Alternative)

1. **Go to Google AI Studio**
   - https://aistudio.google.com/apikey

2. **Click "Create API Key"**

3. **Select your project** (atlas)

4. **Copy the generated key**

## If You Get Permission Errors

If you see "You currently do not have permission to create API keys", you need someone with **Owner** or **Organization Admin** role to:

1. **Grant you the "API Keys Admin" role:**
   - Go to: https://console.cloud.google.com/iam-admin/iam?project=atlas
   - Find your account (`vince@voidwalker.eu`)
   - Click the pencil icon
   - Add role: `API Keys Admin` (roles/apikeys.admin)
   - Click "SAVE"

2. **Enable required APIs:**
   - Go to: https://console.cloud.google.com/apis/library?project=atlas
   - Enable: "API Keys API" (apikeys.googleapis.com)
   - Enable: "Vertex AI API" (aiplatform.googleapis.com)

## After Getting the API Key

1. **Add it to your `.env.local` file:**
   ```bash
   GOOGLE_GEMINI_API_KEY=AIza...your-key-here
   ```

2. **Restart your Next.js dev server:**
   ```bash
   npm run dev
   ```

3. **Test it:**
   - The code will automatically use the API key
   - Try uploading an image in the admin panel to test media analysis

## Current Code Status

✅ The code is already set up to use Gemini API keys
✅ It works with keys from both Gemini Studio and Vertex AI
✅ No code changes needed - just add the API key to your environment

## Troubleshooting

- **"API key not valid"**: Make sure the key starts with `AIza` and is complete
- **"Permission denied"**: The API key might be restricted - check restrictions in Console
- **"API not enabled"**: Ask an admin to enable "Vertex AI API" or "Generative Language API"

