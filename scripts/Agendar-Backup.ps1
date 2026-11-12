$ErrorActionPreference='Stop'
$script=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'Backup-Caderneta.ps1')).Path
$pwsh=(Get-Command pwsh -ErrorAction SilentlyContinue).Source
if(!$pwsh){$pwsh=(Get-Command powershell.exe).Source}
$acao=New-ScheduledTaskAction -Execute $pwsh -Argument ('-NoProfile -NonInteractive -WindowStyle Hidden -File "'+$script+'"')
$gatilho=New-ScheduledTaskTrigger -Daily -At '03:00'
$principal=New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$config=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 20)
Register-ScheduledTask -TaskName 'Caderneta Backup Diario' -Action $acao -Trigger $gatilho -Principal $principal -Settings $config -Description 'Backup local MySQL da Caderneta; retenção de 30 dias.' -Force | Select-Object TaskName,State
