#!/usr/bin/env pwsh
# Anonix auto-push hook — her dosya değişikliğinden sonra commit + push
# Log: .claude/auto-push.log (debug için açık tutuluyor)

$ErrorActionPreference = 'Continue'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logFile = Join-Path $PSScriptRoot 'auto-push.log'
$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

function Log($msg) {
  "[$ts] $msg" | Out-File -FilePath $logFile -Append -Encoding utf8
}

try {
  $changed = & git status --porcelain 2>&1
  if (-not $changed) {
    Log "no changes — skip"
    exit 0
  }

  Log "changes detected: $($changed -join '; ')"

  & git add -A 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
  $commitMsg = "auto: $ts"
  & git -c user.email='noreply@anthropic.com' -c user.name='Claude' commit -m $commitMsg 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8

  if ($LASTEXITCODE -ne 0) {
    Log "commit failed (exit $LASTEXITCODE)"
    exit 0
  }

  & git push origin main 2>&1 | Out-File -FilePath $logFile -Append -Encoding utf8
  if ($LASTEXITCODE -ne 0) {
    Log "push failed (exit $LASTEXITCODE) — credentials issue likely"
  } else {
    Log "pushed successfully"
  }
} catch {
  Log "exception: $_"
}

exit 0
