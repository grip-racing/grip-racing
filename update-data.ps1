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

# Incrementar versão do cache
Write-Host "🔄 Incrementando versão do cache..." -NoNewline
try {
    $jsFiles = @("js\piloto-detalhes.js", "js\piloto-detalhes-v2.js")
    $newVersion = $null
    $filesUpdated = 0
    
    foreach ($jsFile in $jsFiles) {
        $content = Get-Content $jsFile -Raw
        
        # Encontrar a versão atual (apenas no primeiro arquivo)
        if ($null -eq $newVersion -and $content -match "const DATA_VERSION = '(\d+)\.(\d+)\.(\d+)'") {
            $major = [int]$matches[1]
            $minor = [int]$matches[2]
            $patch = [int]$matches[3]
            
            # Incrementar patch version
            $patch++
            $newVersion = "$major.$minor.$patch"
        }
        
        # Substituir no arquivo
        if ($null -ne $newVersion) {
            $content = $content -replace "const DATA_VERSION = '(\d+)\.(\d+)\.(\d+)'", "const DATA_VERSION = '$newVersion'"
            Set-Content $jsFile -Value $content -NoNewline
            $filesUpdated++
        }
    }
    
    if ($filesUpdated -eq $jsFiles.Count) {
        Write-Host " ✅ v$newVersion ($filesUpdated arquivos)" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ Apenas $filesUpdated/$($jsFiles.Count) arquivos atualizados" -ForegroundColor Yellow
    }
} catch {
    Write-Host " ❌ Erro: $_" -ForegroundColor Red
}

# Regenerar manifest de fotos de pilotos
Write-Host "📸 Atualizando manifest de fotos de pilotos..." -NoNewline
try {
    $fotosDir = "assets\pilotos"
    $fotos = @(Get-ChildItem -Path $fotosDir -Filter "*.png" | ForEach-Object {
        $_.BaseName
    } | Sort-Object)
    $manifest = ConvertTo-Json -InputObject $fotos -Compress
    Set-Content "$fotosDir\manifest.json" -Value $manifest -NoNewline
    Write-Host " ✅ ($($fotos.Count) foto(s))" -ForegroundColor Green
} catch {
    Write-Host " ❌ Erro: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Dados atualizados! Recarregue o site no navegador." -ForegroundColor Cyan
