#!/bin/bash
# Check your current permissions on the project

PROJECT_ID="atlas"
YOUR_EMAIL="vince@voidwalker.eu"

echo "Checking your current IAM roles on project: $PROJECT_ID"
echo "=========================================="

# Check what roles you have
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:$YOUR_EMAIL" \
  --format="table(bindings.role)"

echo ""
echo "Checking if you can view the project..."
gcloud projects describe $PROJECT_ID

echo ""
echo "If you see errors above, you may need:"
echo "1. Organization Admin to grant you permissions"
echo "2. Project Owner to grant you permissions"
echo "3. Or use the Console UI instead of CLI"

