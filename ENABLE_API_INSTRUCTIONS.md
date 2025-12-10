# Enable Generative Language API

The API key is working, but you need to enable the Generative Language API in your Google Cloud project.

## Quick Fix

1. **Click this link to enable the API:**
   - https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=1035216740294

2. **Or manually:**
   - Go to: https://console.cloud.google.com/apis/library?project=atlas
   - Search for "Generative Language API"
   - Click on it
   - Click "ENABLE"

3. **Wait 1-2 minutes** for the API to propagate

4. **Run the test again:**
   ```bash
   node test-gemini-video.js
   ```

## Alternative: Use Vertex AI API

If you prefer to use Vertex AI (which you mentioned earlier), you can:

1. **Enable Vertex AI API instead:**
   - Go to: https://console.cloud.google.com/apis/library?project=atlas
   - Search for "Vertex AI API"
   - Click "ENABLE"

2. **Then we'll need to update the code** to use Vertex AI endpoints instead of the Generative Language API

## Current Status

✅ API key is valid and working  
❌ Generative Language API needs to be enabled  
⏳ Once enabled, video analysis will work

