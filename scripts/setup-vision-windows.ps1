# Setup model vision (LLaVA) untuk ekstraksi invoice dari gambar - jalan di Windows dengan Ollama
# Jalankan: powershell -ExecutionPolicy Bypass -File scripts/setup-vision-windows.ps1

Write-Host "=== Setup Vision Model (Ollama + LLaVA) di Windows ===" -ForegroundColor Cyan
Write-Host ""

# Cek Ollama terinstall
$ollamaPath = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollamaPath) {
    Write-Host "Ollama belum terinstall." -ForegroundColor Yellow
    Write-Host "1. Download dari: https://ollama.com/download/windows" -ForegroundColor White
    Write-Host "2. Install Ollama, lalu jalankan script ini lagi." -ForegroundColor White
    exit 1
}

Write-Host "[OK] Ollama ditemukan: $($ollamaPath.Source)" -ForegroundColor Green

# Cek API jalan
try {
    $r = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[OK] Ollama API berjalan di http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "Ollama API tidak merespons. Buka aplikasi Ollama dari Start Menu atau jalankan: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Pull model llava (versi 7b agar tidak terlalu besar)
Write-Host ""
Write-Host "Mengunduh model LLaVA (llava:7b). Ini bisa beberapa menit dan ~4GB ..." -ForegroundColor Cyan
& ollama pull llava:7b
if ($LASTEXITCODE -ne 0) {
    Write-Host "Gagal pull llava:7b. Coba manual: ollama pull llava" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Selesai ===" -ForegroundColor Green
Write-Host ""
Write-Host "Langkah berikutnya: atur backend/config/app.env dengan:" -ForegroundColor White
Write-Host "  EXTRACT_PROVIDER=deepseek" -ForegroundColor Gray
Write-Host "  DEEPSEEK_BASE_URL=http://localhost:11434" -ForegroundColor Gray
Write-Host "  DEEPSEEK_API_KEY=" -ForegroundColor Gray
Write-Host "  DEEPSEEK_MODEL=llava:7b" -ForegroundColor Gray
Write-Host ""
Write-Host "Lalu restart backend Anda." -ForegroundColor White
Write-Host "Panduan lengkap: docs/SETUP-VISION-WINDOWS.md" -ForegroundColor Gray
