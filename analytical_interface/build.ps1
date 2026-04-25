# Monta a pasta zenodo/ a partir da raiz do repositorio (pai desta pasta).
# Copia os 3 CSVs canonicos, a interface estatica e executa export_static_data.

$ErrorActionPreference = "Stop"
$Z = $PSScriptRoot
$Repo = Split-Path $Z -Parent

$csv = @(
    "articles_dataset.csv",
    "topics_dataset.csv",
    "megatopics_dataset.csv"
)
New-Item -ItemType Directory -Force -Path (Join-Path $Z "dataset") | Out-Null
foreach ($f in $csv) {
    $src = Join-Path $Repo "tabelas\$f"
    if (-not (Test-Path $src)) { throw "Ausente: $src" }
    Copy-Item $src (Join-Path $Z "dataset\$f") -Force
}

$fe = Join-Path $Z "frontend"
if (Test-Path $fe) { Remove-Item $fe -Recurse -Force }
Copy-Item (Join-Path $Repo "hub\frontend") $fe -Recurse -Force

Push-Location $Z
try {
    python "code\export_static_data.py"
}
finally {
    Pop-Location
}

Write-Host "Zenodo pronto em: $Z"
