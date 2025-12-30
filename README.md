# System Management IMB

Sistem manajemen untuk IMB (Izin Mendirikan Bangunan) dengan backend Go dan frontend React + TypeScript.

## 📋 Daftar Isi

- [Prasyarat](#prasyarat)
- [Struktur Project](#struktur-project)
- [Development Mode](#development-mode)
  - [Backend Development](#backend-development)
  - [Frontend Development](#frontend-development)
- [Production Mode](#production-mode)
  - [Menggunakan Docker Compose](#menggunakan-docker-compose)
  - [Manual Build & Run](#manual-build--run)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Troubleshooting](#troubleshooting)

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstall:

- **Go** (versi 1.23.4 atau lebih tinggi) - [Download](https://golang.org/dl/)
- **Node.js** (versi 20 atau lebih tinggi) - [Download](https://nodejs.org/)
- **npm** atau **yarn** (terinstall bersama Node.js)
- **Docker** dan **Docker Compose** (untuk production) - [Download](https://www.docker.com/)
- **MySQL** (atau akses ke database MySQL)

## Struktur Project

```
SystemManagementIMB/
├── backend/          # Backend Go application
│   ├── cmd/         # Entry point aplikasi
│   ├── config/      # Konfigurasi aplikasi
│   ├── internal/    # Kode internal aplikasi
│   └── pkg/         # Package yang dapat digunakan ulang
├── frontend/         # Frontend React + TypeScript
│   ├── src/         # Source code React
│   └── public/      # File static
└── docker-compose.yml # Konfigurasi Docker Compose
```

## Development Mode

### Backend Development

1. **Masuk ke direktori backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   go mod download
   ```

3. **Konfigurasi environment:**
   
   Edit file `backend/config/app.env` dengan konfigurasi database Anda:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=imbbackend
   PORT=8002
   UPLOAD_DIR=./uploads
   BASE_URL=http://localhost:8002
   JWT_SECRET=your_secret_key
   JWT_EXPIRY=24h
   ```

4. **Jalankan aplikasi:**
   ```bash
   go run cmd/main.go
   ```

   Atau build terlebih dahulu:
   ```bash
   go build -o main cmd/main.go
   ./main
   ```

5. **Backend akan berjalan di:** `http://localhost:8002`

### Frontend Development

1. **Masuk ke direktori frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Jalankan development server:**
   ```bash
   npm run dev
   ```

4. **Frontend akan berjalan di:** `http://localhost:5173` (default Vite port)

   > **Catatan:** Pastikan backend sudah berjalan dan konfigurasi API endpoint di frontend mengarah ke `http://localhost:8002`

## Production Mode

### Menggunakan Docker Compose (Recommended)

Cara termudah untuk menjalankan aplikasi di production adalah menggunakan Docker Compose.

1. **Konfigurasi Environment:**
   
   Edit file `docker-compose.yml` dan sesuaikan environment variables:
   ```yaml
   services:
     backend:
       environment:
         DB_HOST: your_db_host
         DB_PORT: 3306
         DB_USER: your_db_user
         DB_PASSWORD: your_db_password
         DB_NAME: imbbackend
         PORT: 8002
         UPLOAD_DIR: ./uploads
         BASE_URL: https://your-domain.com
         JWT_SECRET: your_secure_secret_key
         JWT_EXPIRY: 24h
   ```

   Atau edit file `backend/config/app.env` untuk konfigurasi default.

2. **Build dan jalankan dengan Docker Compose:**
   ```bash
   # Build dan start containers
   docker-compose up -d --build
   
   # Lihat logs
   docker-compose logs -f
   
   # Stop containers
   docker-compose down
   ```

3. **Akses aplikasi:**
   - **Backend:** `http://localhost:8002`
   - **Frontend:** `http://localhost:3003`

### Manual Build & Run

#### Backend Production

1. **Build aplikasi:**
   ```bash
   cd backend
   go build -o main cmd/main.go
   ```

2. **Jalankan aplikasi:**
   ```bash
   ./main
   ```

   Atau dengan environment variables:
   ```bash
   DB_HOST=localhost DB_PORT=3306 DB_USER=user DB_PASSWORD=pass DB_NAME=imbbackend PORT=8002 ./main
   ```

#### Frontend Production

1. **Build aplikasi:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Preview build (opsional):**
   ```bash
   npm run preview
   ```

3. **Deploy build folder:**
   
   Folder `frontend/dist` berisi file yang siap untuk di-deploy ke web server seperti Nginx, Apache, atau hosting static lainnya.

   **Contoh dengan Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /path/to/frontend/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## Konfigurasi Environment

### Backend Environment Variables

File: `backend/config/app.env`

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `DB_HOST` | Host database MySQL | `localhost` |
| `DB_PORT` | Port database MySQL | `3306` |
| `DB_USER` | Username database | - |
| `DB_PASSWORD` | Password database | - |
| `DB_NAME` | Nama database | `imbbackend` |
| `PORT` | Port aplikasi backend | `8002` |
| `UPLOAD_DIR` | Direktori untuk upload file | `./uploads` |
| `BASE_URL` | Base URL aplikasi | `http://localhost:8002` |
| `JWT_SECRET` | Secret key untuk JWT | - |
| `JWT_EXPIRY` | Expiry time untuk JWT | `24h` |

### Frontend Configuration

Pastikan konfigurasi API endpoint di frontend mengarah ke backend yang benar. Biasanya ada di file konfigurasi API atau environment variables.

## Troubleshooting

### Backend tidak bisa connect ke database

1. Pastikan MySQL server berjalan
2. Periksa kredensial database di `backend/config/app.env`
3. Pastikan database sudah dibuat
4. Periksa firewall jika menggunakan remote database

### Frontend tidak bisa connect ke backend

1. Pastikan backend sudah berjalan
2. Periksa CORS settings di backend
3. Periksa konfigurasi API endpoint di frontend
4. Periksa firewall/port yang digunakan

### Docker build error

1. Pastikan Docker dan Docker Compose sudah terinstall
2. Periksa Dockerfile di backend dan frontend
3. Pastikan semua file yang diperlukan ada
4. Coba build ulang dengan `docker-compose build --no-cache`

### Port sudah digunakan

Jika port 8002 atau 3003 sudah digunakan:

1. **Backend:** Ubah `PORT` di `backend/config/app.env` atau di `docker-compose.yml`
2. **Frontend:** Ubah port mapping di `docker-compose.yml` atau gunakan flag `--port` saat menjalankan `npm run dev`

### Go module error

```bash
cd backend
go mod tidy
go mod download
```

### Node modules error

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Scripts yang Tersedia

### Backend
- `go run cmd/main.go` - Menjalankan aplikasi di development
- `go build -o main cmd/main.go` - Build aplikasi

### Frontend
- `npm run dev` - Menjalankan development server
- `npm run build` - Build untuk production
- `npm run preview` - Preview build production
- `npm run lint` - Lint code

## Catatan Penting

1. **Security:** Jangan commit file `app.env` yang berisi kredensial ke repository. Gunakan `.env.example` sebagai template.

2. **Database:** Pastikan database sudah dibuat sebelum menjalankan aplikasi. Migrasi database dapat dijalankan secara manual atau melalui aplikasi.

3. **Upload Directory:** Pastikan direktori `uploads` memiliki permission yang tepat untuk menulis file.

4. **Production:** Untuk production, pastikan:
   - Menggunakan HTTPS
   - JWT_SECRET yang kuat dan aman
   - Database credentials yang aman
   - CORS dikonfigurasi dengan benar
   - Environment variables tidak ter-expose

## Support

Jika mengalami masalah, silakan buat issue di repository atau hubungi tim development.

