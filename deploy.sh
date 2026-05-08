#!/bin/bash
# Deploy to Google Cloud Run

PROJECT_ID="fleet-toolbox-495705-h8"
BILLING_ACCOUNT="RHPDF32X8F6689LB"
REGION="us-central1"
SERVICE_NAME="prompt-wars"

echo "🔗 Linking Billing Account to Project..."
gcloud beta billing projects link $PROJECT_ID --billing-account $BILLING_ACCOUNT

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID,VERTEX_AI_PROJECT_ID=$VERTEX_AI_PROJECT_ID,VERTEX_AI_LOCATION=$VERTEX_AI_LOCATION,NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"

echo "✅ Deployment finished!"
