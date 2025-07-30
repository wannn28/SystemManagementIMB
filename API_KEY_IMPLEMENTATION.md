# API Key Implementation - Database Storage

## Overview
API key sekarang disimpan di database, bukan di localStorage. Ini memungkinkan API key untuk tetap tersedia ketika pengguna berganti browser atau device.

## Backend Implementation

### 1. Entity
- **File**: `backend/internal/entity/api_key.go`
- **Struktur**: 
  - `ID`: Primary key
  - `UserID`: Foreign key ke tabel users
  - `ApiKey`: String untuk menyimpan API key
  - `CreatedAt`, `UpdatedAt`: Timestamp

### 2. Migration
- **File**: `backend/db/migrations/003_create_api_keys_table.up.sql`
- **Fitur**:
  - Foreign key constraint ke tabel users
  - Unique constraint pada user_id (satu user hanya bisa punya satu API key)
  - Cascade delete ketika user dihapus

### 3. Repository
- **File**: `backend/internal/repository/api_key_repository.go`
- **Methods**:
  - `GetApiKeyByUserID(userID uint)`: Ambil API key berdasarkan user ID
  - `UpsertApiKey(userID uint, apiKey string)`: Buat atau update API key
  - `DeleteApiKey(userID uint)`: Hapus API key

### 4. Service
- **File**: `backend/internal/service/api_key_service.go`
- **Methods**:
  - `GetApiKey(userID uint)`: Ambil API key
  - `UpsertApiKey(userID uint, apiKey string)`: Simpan atau update API key
  - `DeleteApiKey(userID uint)`: Hapus API key

### 5. Handler
- **File**: `backend/internal/http/api_key_handler.go`
- **Endpoints**:
  - `GET /api/user/api-key`: Ambil API key user yang sedang login
  - `POST /api/user/api-key`: Simpan atau update API key
  - `DELETE /api/user/api-key`: Hapus API key

### 6. Routes
- **File**: `backend/pkg/route/api_key_route.go`
- **Middleware**: JWT authentication dengan role "user"
- **Base path**: `/api/user`

## Frontend Implementation

### 1. API Service
- **File**: `frontend/src/api/apiKey.ts`
- **Methods**:
  - `getApiKey()`: Ambil API key dari backend
  - `saveApiKey(apiKey: string)`: Simpan API key ke backend
  - `deleteApiKey()`: Hapus API key dari backend

### 2. Settings Component
- **File**: `frontend/src/pages/Settings.tsx`
- **Perubahan**:
  - Load API key dari backend saat komponen mount
  - Simpan API key ke backend saat user menyimpan
  - Hapus API key dari backend saat user menghapus
  - Validasi API key tetap dilakukan sebelum disimpan

## API Endpoints

### GET /api/user/api-key
**Response**:
```json
{
  "data": {
    "api_key": "your-api-key-here",
    "user_id": 1
  }
}
```

### POST /api/user/api-key
**Request**:
```json
{
  "api_key": "your-api-key-here"
}
```
**Response**:
```json
{
  "data": {
    "message": "API key saved successfully",
    "user_id": 1
  }
}
```

### DELETE /api/user/api-key
**Response**:
```json
{
  "data": {
    "message": "API key deleted successfully",
    "user_id": 1
  }
}
```

## Keuntungan

1. **Persistensi**: API key tidak hilang ketika ganti browser/device
2. **Keamanan**: API key disimpan di database dengan enkripsi
3. **Multi-device**: Bisa diakses dari berbagai device
4. **User-specific**: Setiap user punya API key sendiri
5. **Validasi**: Tetap ada validasi API key sebelum disimpan

## Cara Penggunaan

1. User login ke aplikasi
2. Buka halaman Settings
3. Masukkan API key Smart Nota
4. Klik "Simpan & Validasi" untuk validasi dan simpan
5. API key akan disimpan di database dan tersedia di semua device

## Database Schema

```sql
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);
``` 