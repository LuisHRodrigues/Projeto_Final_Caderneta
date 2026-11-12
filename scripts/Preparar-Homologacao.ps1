$ErrorActionPreference='Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try{
 if(!(Test-Path -LiteralPath '.env.homologacao')){
   function Segredo { [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)) }
   @("MYSQL_ROOT_PASSWORD=$(Segredo)","CADERNETA_DB_PASSWORD=$(Segredo)","CADERNETA_MIGRATION_PASSWORD=$(Segredo)","SPRING_PROFILES_ACTIVE=dev","CADERNETA_BOOTSTRAP_LOGIN=gerente.homologacao","CADERNETA_BOOTSTRAP_SENHA=$(Segredo)","CADERNETA_BOOTSTRAP_CPF=52998224725") | Set-Content -LiteralPath .env.homologacao
 }
 docker compose --env-file .env.homologacao -f docker-compose.homologacao.yml -p caderneta-homologacao up -d mysql
 if($LASTEXITCODE -ne 0){throw 'Falha ao preparar MySQL isolado.'}
}finally{Pop-Location}
