# Model Vision Gratis di Windows (Ollama + LLaVA)

Agar fitur **ekstraksi invoice dari gambar** bisa jalan tanpa pakai Gemini (tanpa limit/kuota), Anda bisa menjalankan model vision **LLaVA** lewat **Ollama** di Windows. Semuanya gratis dan jalan di komputer Anda.

---

## 1. Install Ollama di Windows

1. **Download installer**
   - Buka: **https://ollama.com/download/windows**
   - Download **OllamaSetup.exe** (atau pakai Windows Store jika tersedia).

2. **Jalankan installer**
   - Double-click installer, ikuti langkah instalasi.
   - Setelah selesai, Ollama biasanya jalan di background (lihat ikon di system tray).

3. **(Opsional) Install lewat PowerShell**
   ```powershell
   irm https://ollama.com/install.ps1 | iex
   ```

**Catatan:** Kalau pakai GPU NVIDIA, pastikan driver GPU sudah terbaru supaya inferensi lebih cepat.

---

## 2. Download model vision LLaVA

Buka **PowerShell** atau **Command Prompt**, lalu jalankan:

```powershell
ollama pull llava
```

Ini akan mengunduh model **llava** (ukuran ~4–5 GB). Versi lebih kecil (lebih hemat RAM/disk):

```powershell
ollama pull llava:7b
```

Versi lebih besar (biasanya lebih akurat, butuh RAM lebih banyak):

```powershell
ollama pull llava:13b
```

Tunggu sampai selesai. Setelah itu model siap dipakai.

---

## 3. Pastikan Ollama API jalan

Ollama otomatis menjalankan API di:

- **URL:** `http://localhost:11434`
- **Endpoint chat (OpenAI-compatible):** `http://localhost:11434/v1/chat/completions`

Cek dari browser atau PowerShell:

```powershell
# Cek apakah Ollama merespons
curl http://localhost:11434/api/tags
```

Kalau ada JSON berisi daftar model (termasuk `llava`), API sudah jalan.

---

## 4. Atur backend agar pakai Ollama (bukan Gemini)

Edit file **`backend/config/app.env`**:

```env
# Ganti dari gemini ke deepseek (client kita pakai untuk semua API OpenAI-compatible, termasuk Ollama)
EXTRACT_PROVIDER=deepseek

# URL Ollama (tanpa path)
DEEPSEEK_BASE_URL=http://localhost:11434

# Kosongkan saja untuk Ollama lokal
DEEPSEEK_API_KEY=

# Nama model yang tadi di-pull (llava, llava:7b, atau llava:13b)
DEEPSEEK_MODEL=llava
```

Simpan, lalu **restart backend** (stop lalu jalankan lagi `go run cmd/main.go` atau service Anda).

---

## 5. Tes dari aplikasi

1. Buka aplikasi invoice.
2. Buat/edit invoice, lalu gunakan fitur **upload gambar** (satu gambar per baris atau banyak gambar).
3. Pilih file gambar nota/timesheet.
4. Jika konfigurasi benar, backend akan memanggil Ollama (LLaVA) dan mengisi tanggal/hari/jam dari gambar.

---

## Troubleshooting

| Masalah | Solusi |
|--------|--------|
| `ollama` tidak dikenali | Tambahkan folder install Ollama ke PATH, atau buka terminal dari folder Ollama. Default: `C:\Users\<User>\AppData\Local\Programs\Ollama` |
| Port 11434 tidak merespons | Buka Ollama dari Start Menu / system tray sekali, atau jalankan `ollama serve` di terminal. |
| Error 422 / parse JSON | Respons model kadang tidak JSON murni. Coba gunakan `llava:13b` atau pastikan gambar jelas (nota/timesheet terbaca). |
| Sangat lambat | Pakai `llava:7b` untuk kecepatan, atau pastikan GPU NVIDIA terdeteksi (Ollama pakai GPU otomatis kalau ada). |

---

## Ringkasan

- **Ollama** = runtime untuk model LLM/vision di PC Anda.
- **LLaVA** = model vision yang bisa “baca” gambar dan ikuti instruksi (termasuk ekstrak teks/struktur).
- Backend kita memanggil `http://localhost:11434/v1/chat/completions` (format OpenAI-compatible) dengan gambar + prompt, lalu parsing JSON dari respons LLaVA.

Dengan ini, model vision jalan di Windows Anda secara gratis dan tanpa bergantung ke Gemini.
