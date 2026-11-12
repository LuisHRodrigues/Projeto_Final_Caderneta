$ErrorActionPreference='Stop'
$raiz=Split-Path $PSScriptRoot -Parent
Push-Location $raiz
try{
 $sdk=flutter --version --machine | ConvertFrom-Json
 if($sdk.frameworkVersion -ne '3.47.9'){throw 'Use Flutter 3.47.9, conforme .fvmrc e as referências visuais verificadas.'}
 & ./scripts/Preparar-Homologacao.ps1
 $cache=Join-Path $env:USERPROFILE '.m2'
 docker run --rm --network caderneta-homologacao_default --env-file .env.homologacao -e 'SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/api_caderneta_database?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC' -v ("${raiz}/backend-repo:/app") -v ("${cache}:/root/.m2") -w /app maven:3.9.9-eclipse-temurin-21 mvn -B package
 if($LASTEXITCODE -ne 0){throw 'Backend reprovado; entrega interrompida.'}
 Push-Location frontend-repo
 try{
  flutter pub get --enforce-lockfile
  if($LASTEXITCODE -ne 0){throw 'Dependências não correspondem ao lockfile.'}
  flutter analyze --no-pub
  if($LASTEXITCODE -ne 0){throw 'Análise estática reprovada.'}
  flutter test --no-pub --concurrency=1
  if($LASTEXITCODE -ne 0){throw 'Testes do frontend reprovados.'}
  flutter build web --no-pub --release --no-web-resources-cdn --dart-define=MOCK_API=false
  if($LASTEXITCODE -ne 0){throw 'Build do frontend falhou.'}
 }finally{Pop-Location}
 docker compose --env-file .env.homologacao -f docker-compose.homologacao.yml -p caderneta-homologacao build backend frontend
 if($LASTEXITCODE -ne 0){throw 'Empacotamento falhou.'}
}finally{Pop-Location}
