#!/usr/bin/env bash
# Sobe o sistema com pouco uso de memória: compila o Flutter fora do Docker, empacota só o resultado
# e constrói as imagens em sequência (nada de dois builds pesados ao mesmo tempo).
# Pré-requisitos: .env preenchido (ver .env.example) e Flutter na versão fixada abaixo.
set -euo pipefail
cd "$(dirname "$0")"

FLUTTER_FIXO=3.47.9   # mesmo valor do frontend-repo/Dockerfile e do CI
atual=$(flutter --version --machine 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["frameworkVersion"])')
if [ "$atual" != "$FLUTTER_FIXO" ]; then
  echo "Flutter $atual encontrado; o projeto usa $FLUTTER_FIXO. Rode: flutter upgrade && flutter --version" >&2
  exit 1
fi

echo ">> 1/4 Flutter web (build local, dependências exatamente as do pubspec.lock)"
( cd frontend-repo && flutter pub get --enforce-lockfile \
  && flutter build web --release --no-web-resources-cdn --dart-define=MOCK_API=false )

echo ">> 2/4 Imagem do backend (também usada pelo serviço de migração)"
docker compose build backend

echo ">> 3/4 Imagem do frontend (apenas empacota build/web)"
docker build -f frontend-repo/Dockerfile.local -t projeto_final_caderneta-frontend ./frontend-repo

echo ">> 4/4 Subindo (sem rebuild): mysql -> migracao -> backend -> frontend"
docker compose up -d --no-build
echo "Pronto: http://localhost:3000"
