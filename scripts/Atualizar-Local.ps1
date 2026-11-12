param([string]$Evidencias='C:/Dev/Backups/Caderneta/atualizacao-local')
$ErrorActionPreference='Stop'
$raiz=Split-Path $PSScriptRoot -Parent
Push-Location $raiz
try {
 if(!(Test-Path '.env') -or !(Test-Path 'backend-repo/target/api-caderneta-0.0.1-SNAPSHOT.jar') -or !(Test-Path 'frontend-repo/build/web/main.dart.js')) {throw 'Prepare os artefatos e .env antes da atualização.'}
 $config=@{}
 Get-Content .env | Where-Object {$_ -match '^[A-Z_]+='} | ForEach-Object {$k,$v=$_ -split '=',2;$config[$k]=$v}
 foreach($k in 'MYSQL_ROOT_PASSWORD','CADERNETA_DB_PASSWORD','CADERNETA_MIGRATION_PASSWORD'){
  if($config[$k] -notmatch '^[a-zA-Z0-9]{32,}$'){throw "Segredo inválido em $k"}
 }
 New-Item -ItemType Directory -Force $Evidencias | Out-Null
 function Consultar([string]$Sql){
  $r=docker exec projeto_final_caderneta-mysql-1 sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -N -B api_caderneta_database -e "$1"' sh $Sql
  if($LASTEXITCODE -ne 0){throw 'Consulta de integridade falhou.'}
  return ($r -join [Environment]::NewLine)
 }
 $versao=Consultar "SELECT MAX(CAST(version AS UNSIGNED)) FROM flyway_schema_history WHERE success=1 AND version IS NOT NULL"
 if($versao -notin '7','8'){throw 'Histórico antigo não reconciliado. Restaure e migre uma cópia isolada antes de continuar.'}
 if((Consultar "SELECT COUNT(*) FROM flyway_schema_history WHERE success=0") -ne '0'){throw 'Migration falhou no histórico.'}
 if((Consultar "SELECT COUNT(*) FROM (SELECT REPLACE(REPLACE(REPLACE(cpf,'.',''),'-',''),' ','') AS c FROM pessoas GROUP BY c HAVING COUNT(*)>1) x") -ne '0'){throw 'Colisões de CPF exigem reconciliação explícita.'}
 $consulta="SELECT COUNT(*),COALESCE(SHA2(GROUP_CONCAT(CONCAT_WS(CHAR(124),id,data_hora,valor_total,cliente_id,funcionario_id) ORDER BY id),256),'vazio') FROM vendas; SELECT COUNT(*),COALESCE(SHA2(GROUP_CONCAT(CONCAT_WS(CHAR(124),id,data_pagamento,valor_pago,metodo_pagamento,divida_id) ORDER BY id),256),'vazio') FROM pagamentos;"
 $antes=Consultar $consulta
 $antes | Set-Content (Join-Path $Evidencias 'financeiro-antes.txt')
 & ./scripts/Backup-Caderneta.ps1 -Destino $Evidencias | ConvertTo-Json | Set-Content (Join-Path $Evidencias 'backup.json')
 $instante=Get-Date -Format 'yyyyMMdd-HHmmss'
 docker image tag projeto_final_caderneta-backend:latest ("caderneta-backend:antes-"+$instante)
 if($LASTEXITCODE -ne 0){throw 'Não foi possível preservar a imagem anterior do backend.'}
 docker image tag projeto_final_caderneta-frontend:latest ("caderneta-frontend:antes-"+$instante)
 if($LASTEXITCODE -ne 0){throw 'Não foi possível preservar a imagem anterior do frontend.'}
 # A configuração gerada contém somente senhas alfanuméricas, sem interpolação SQL arbitrária.
 $sql=@"
CREATE USER IF NOT EXISTS 'caderneta_app'@'%' IDENTIFIED BY '$($config['CADERNETA_DB_PASSWORD'])';
ALTER USER 'caderneta_app'@'%' IDENTIFIED BY '$($config['CADERNETA_DB_PASSWORD'])';
CREATE USER IF NOT EXISTS 'caderneta_migracao'@'%' IDENTIFIED BY '$($config['CADERNETA_MIGRATION_PASSWORD'])';
ALTER USER 'caderneta_migracao'@'%' IDENTIFIED BY '$($config['CADERNETA_MIGRATION_PASSWORD'])';
GRANT SELECT,INSERT,UPDATE,DELETE ON api_caderneta_database.* TO 'caderneta_app'@'%';
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP,ALTER,INDEX,REFERENCES,CREATE TEMPORARY TABLES,LOCK TABLES ON api_caderneta_database.* TO 'caderneta_migracao'@'%';
ALTER USER 'root'@'localhost' IDENTIFIED BY '$($config['MYSQL_ROOT_PASSWORD'])';
ALTER USER 'root'@'%' IDENTIFIED BY '$($config['MYSQL_ROOT_PASSWORD'])';
"@
 # Arquivo temporário fora do Git; removido dos dois locais ao terminar a configuração.
 $temp=Join-Path $env:TEMP ('caderneta-users-'+[guid]::NewGuid().ToString('N')+'.sql')
 try {
  [IO.File]::WriteAllText($temp,$sql)
  docker cp $temp projeto_final_caderneta-mysql-1:/tmp/caderneta-users.sql
  if($LASTEXITCODE -ne 0){throw 'Falha ao preparar usuários.'}
  docker exec projeto_final_caderneta-mysql-1 sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot < /tmp/caderneta-users.sql'
  if($LASTEXITCODE -ne 0){throw 'Falha ao separar usuários do banco.'}
 } finally {
  Remove-Item -LiteralPath $temp -ErrorAction SilentlyContinue
  docker exec projeto_final_caderneta-mysql-1 rm -f /tmp/caderneta-users.sql | Out-Null
 }
 docker compose up -d --build
 if($LASTEXITCODE -ne 0){throw 'Atualização falhou. Consulte as imagens preservadas e o backup; não remova o volume.'}
 $pronto=$false
 for($i=0;$i -lt 45;$i++){
  try{$r=Invoke-WebRequest 'http://127.0.0.1:3000/api/saude' -TimeoutSec 3;if($r.StatusCode -eq 200){$pronto=$true;break}}catch{}
  Start-Sleep -Seconds 2
 }
 if(!$pronto){throw 'API não ficou pronta. Preserve o volume e verifique os logs.'}
 $depois=Consultar $consulta
 $depois | Set-Content (Join-Path $Evidencias 'financeiro-depois.txt')
 if($antes -ne $depois){throw 'Divergência financeira: interrompa a homologação e consulte o backup.'}
 docker compose ps | Out-String | Set-Content (Join-Path $Evidencias 'containers.txt')
 Write-Output 'Atualização concluída; vendas e pagamentos preservados.'
} finally {Pop-Location}
