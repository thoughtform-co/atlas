# Setting Up API Key Permissions via Google Cloud Console UI

Since you don't have CLI permissions, use the Console UI instead:

## Option 1: Grant Yourself Permissions via Console (if you have some admin access)

1. **Go to IAM & Admin → IAM**
   - URL: https://console.cloud.google.com/iam-admin/iam?project=atlas

2. **Find your account** (`vince@voidwalker.eu`) in the list

3. **Click the pencil icon** to edit your permissions

4. **Click "ADD ANOTHER ROLE"** and add these roles:
   - `API Keys Admin` (roles/apikeys.admin)
   - `Service Account Admin` (roles/iam.serviceAccountAdmin) 
   - `Vertex AI User` (roles/aiplatform.user)
   - `Service Usage Admin` (roles/serviceusage.serviceUsageAdmin) - to enable APIs

5. **Click "SAVE"**

## Option 2: Enable APIs via Console

1. **Go to APIs & Services → Enabled APIs**
   - URL: https://console.cloud.google.com/apis/library?project=atlas

2. **Click "+ ENABLE APIS AND SERVICES"**

3. **Search for and enable:**
   - "API Keys API" (apikeys.googleapis.com)
   - "Identity and Access Management (IAM) API" (iam.googleapis.com)
   - "Vertex AI API" (aiplatform.googleapis.com)

## Option 3: Create API Key via Console (if permissions are granted)

1. **Go to APIs & Services → Credentials**
   - URL: https://console.cloud.google.com/apis/credentials?project=atlas

2. **Click "+ CREATE CREDENTIALS → API Key**

3. **Copy the generated key**

4. **Optionally restrict the key:**
   - Click "RESTRICT KEY"
   - Under "API restrictions", select "Restrict key"
   - Choose "Vertex AI API" or "Generative Language API"

## Option 4: Ask Organization/Project Owner

If you can't grant yourself permissions, you'll need someone with **Owner** or **Organization Admin** role to:

1. Grant you the roles listed in Option 1
2. Enable the APIs listed in Option 2

Then you can create API keys.

