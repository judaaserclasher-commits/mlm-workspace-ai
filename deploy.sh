#!/bin/bash
set -e

PROJECT="mlm-xprize"
REGION="us-central1"
IMAGE="us-central1-docker.pkg.dev/${PROJECT}/mlm-workspace/app"
SERVICE="mlm-workspace"

echo "🚀 Deploy MLM Workspace → Cloud Run"
echo "   Proyecto: ${PROJECT}"
echo "   Imagen:   ${IMAGE}"
echo ""

# Get default compute service account
SA=$(gcloud iam service-accounts list \
  --project="${PROJECT}" \
  --filter="displayName:Compute Engine default" \
  --format="value(email)" 2>/dev/null)

if [ -z "$SA" ]; then
  PROJECT_NUMBER=$(gcloud projects describe "${PROJECT}" --format="value(projectNumber)")
  SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi

echo "   Service account: ${SA}"

# Grant Vertex AI User role to the service account (idempotent)
echo ""
echo "📋 Verificando permisos de Vertex AI..."
gcloud projects add-iam-policy-binding "${PROJECT}" \
  --member="serviceAccount:${SA}" \
  --role="roles/aiplatform.user" \
  --condition=None \
  --quiet 2>/dev/null && echo "   ✅ roles/aiplatform.user asignado"

# Build and push image via Cloud Build
echo ""
echo "🔨 Building imagen Docker con Cloud Build..."
gcloud builds submit \
  --tag "${IMAGE}" \
  --gcs-source-staging-dir gs://mlm-xprize-builds/source \
  --project "${PROJECT}" \
  .

# Deploy to Cloud Run
echo ""
echo "☁️  Desplegando en Cloud Run..."
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --project "${PROJECT}" \
  --allow-unauthenticated \
  --service-account "${SA}" \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT}" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --port 8080

echo ""
echo "✅ Deploy completado."
echo "   URL: $(gcloud run services describe ${SERVICE} --platform managed --region ${REGION} --project ${PROJECT} --format='value(status.url)')"
