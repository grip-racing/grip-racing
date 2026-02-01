# ========================================
# GRIP RACING - UPDATE DATA SCRIPT
# ========================================
# 
# Este script baixa os dados atualizados do Google Sheets
# Para executar: .\update-data.ps1
#

Write-Host "🏁 GRIP RACING - Atualizando dados..." -ForegroundColor Cyan
Write-Host ""

# URLs dos CSVs
$urls = @{
    "data\data-stats.csv" = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuo9H1amEvwBEov9TEyznD312qRkf_KDIBCuf2Rr8NXaaZNpbhYjZsP-7sESi6_Yvl_4v5DaKCmpS2/pub?gid=631542603&single=true&output=csv"
    "data\data-pilotos.csv" = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuo9H1amEvwBEov9TEyznD312qRkf_KDIBCuf2Rr8NXaaZNpbhYjZsP-7sESi6_Yvl_4v5DaKCmpS2/pub?gid=1513812791&single=true&output=csv"
    "data\data-participacoes.csv" = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRuo9H1amEvwBEov9TEyznD312qRkf_KDIBCuf2Rr8NXaaZNpbhYjZsP-7sESi6_Yvl_4v5DaKCmpS2/pub?gid=0&single=true&output=csv"
}

$success = 0
$failed = 0

foreach ($file in $urls.Keys) {
    Write-Host "📥 Baixando $file..." -NoNewline
    
    try {
        curl.exe -L $urls[$file] -o $file --silent
        
        if (Test-Path $file) {
            $size = (Get-Item $file).Length
            $sizeKB = [math]::Round($size / 1KB, 2)
            Write-Host " ✅ ($sizeKB KB)" -ForegroundColor Green
            $success++
        } else {
            Write-Host " ❌ Falhou" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " ❌ Erro: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Sucesso: $success arquivos" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "❌ Falhas: $failed arquivos" -ForegroundColor Red
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Dados atualizados! Recarregue o site no navegador." -ForegroundColor Yellow
