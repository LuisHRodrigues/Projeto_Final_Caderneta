param(
 [string]$Container='projeto_final_caderneta-mysql-1',
 [string]$Destino='C:/Dev/Backups/Caderneta/diarios'
)
$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Force -Path $Destino | Out-Null
$diretorio=(Resolve-Path -LiteralPath $Destino).Path
$nome='caderneta-'+(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+[guid]::NewGuid().ToString('N')+'.sql'
$temporario='/tmp/'+$nome
docker exec $Container sh -c ('MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqldump -uroot --single-transaction --routines --triggers --events --databases api_caderneta_database > '+$temporario)
if($LASTEXITCODE -ne 0){throw 'Falha no mysqldump; nenhum backup anterior foi removido.'}
$arquivo=Join-Path $diretorio $nome
docker cp ("${Container}:"+$temporario) $arquivo
if($LASTEXITCODE -ne 0){throw 'Falha ao copiar backup.'}
if((Get-Item -LiteralPath $arquivo).Length -lt 100){throw 'Backup vazio.'}
$hash=Get-FileHash -LiteralPath $arquivo -Algorithm SHA256
$hash.Hash | Set-Content -LiteralPath ($arquivo+'.sha256')
docker exec $Container rm -- $temporario
# Remove somente backups vencidos diretamente dentro do destino resolvido.
Get-ChildItem -LiteralPath $diretorio -File -Filter 'caderneta-*.sql*' |
 Where-Object LastWriteTime -lt (Get-Date).AddDays(-30) |
 ForEach-Object {if($_.DirectoryName -eq $diretorio){Remove-Item -LiteralPath $_.FullName}}
[pscustomobject]@{Arquivo=$arquivo;SHA256=$hash.Hash}
