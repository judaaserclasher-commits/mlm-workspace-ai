#!/bin/bash
# One-time setup for Vertex AI authentication
# Run: bash setup.sh

echo "🔐 Configurando autenticación con Google Cloud..."
gcloud auth application-default login
gcloud config set project mlm-xprize
echo ""
echo "✅ Listo. Ahora ejecuta: npm run dev:full"
