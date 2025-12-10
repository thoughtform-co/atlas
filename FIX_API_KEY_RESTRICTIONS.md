# Fix API Key Restrictions

The API key is working, but it's restricted and doesn't allow access to the Generative Language API.

## Solution: Update API Key Restrictions

1. **Go to API Key settings:**
   - https://console.cloud.google.com/apis/credentials?project=atlas

2. **Find your API key** (the one starting with `AIzaSyCTp0...`)

3. **Click on the key name** to edit it

4. **Scroll to "API restrictions"**

5. **Select "Restrict key"** (if not already selected)

6. **Under "Select APIs", make sure BOTH are checked:**
   - ✅ **Generative Language API** (generativelanguage.googleapis.com)
   - ✅ **Vertex AI API** (aiplatform.googleapis.com)

7. **Click "SAVE"**

8. **Wait 1-2 minutes** for changes to propagate

9. **Test again:**
   ```bash
   node test-gemini-video.js
   ```

## Alternative: Create a New Unrestricted Key (For Testing)

If you want to test quickly:

1. **Go to:** https://console.cloud.google.com/apis/credentials?project=atlas
2. **Click "+ CREATE CREDENTIALS → API Key"**
3. **Leave restrictions as "Don't restrict key"** (for testing only)
4. **Copy the new key**
5. **Update `.env.local`** with the new key
6. **Test again**

⚠️ **Security Note:** Unrestricted keys should only be used for testing. For production, always restrict keys to specific APIs.

