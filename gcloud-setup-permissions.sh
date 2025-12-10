#!/bin/bash
# Google Cloud IAM Permissions Setup for API Key Creation
# Run these commands in Cloud Shell or with gcloud CLI configured

# Set your project ID (replace with your actual project ID)
PROJECT_ID="atlas"
YOUR_EMAIL="your-email@example.com"  # Replace with your Google account email

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable apikeys.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable aiplatform.googleapis.com  # For Vertex AI

# Grant API Key permissions to your user account
echo "Granting API Key permissions to your account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$YOUR_EMAIL" \
  --role="roles/serviceusage.apiKeysAdmin"

# Grant Service Account permissions (if you need to create service accounts)
echo "Granting Service Account permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$YOUR_EMAIL" \
  --role="roles/iam.serviceAccountAdmin"

# Alternative: Grant all required permissions individually
echo "Granting individual permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$YOUR_EMAIL" \
  --role="roles/apikeys.admin"

# Grant Vertex AI User role (for using Vertex AI)
echo "Granting Vertex AI permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$YOUR_EMAIL" \
  --role="roles/aiplatform.user"

echo "Setup complete! You should now be able to create API keys."

