#!/usr/bin/env bash
# Sobe o sistema com pouco uso de memória: compila o Flutter fora do Docker, empacota só o resultado
# e constrói as imagens em sequência (nada de dois builds pesados ao mesmo tempo).
set -euo pipefail
cd "$(dirname "$0")"

echo ">> 1/4 Flutter web (build local)"
( cd frontend-repo && flutter pub get && flutter build web --release --no-web-resources-cdn --dart-define=MOCK_API=false )

echo ">> 2/4 Imagem do backend"
docker compose build backend

echo ">> 3/4 Imagem do frontend (apenas empacota build/web)"
docker build -f frontend-repo/Dockerfile.local -t projeto_final_caderneta-frontend ./frontend-repo

echo ">> 4/4 Subindo (sem rebuild)"
docker compose up -d --no-build
echo "Pronto: http://localhost:3000"
