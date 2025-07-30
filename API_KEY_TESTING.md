# API Key Testing Guide

## Setup

1. **Backend**: Pastikan backend berjalan di `http://localhost:8002`
2. **Frontend**: Pastikan frontend berjalan di `http://localhost:5173`
3. **Database**: Pastikan database MySQL berjalan dan tabel `api_keys` sudah dibuat

## Testing Steps

### 1. Login untuk mendapatkan JWT Token

**POST** `http://localhost:8002/api/login`

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Test GET API Key

**GET** `http://localhost:8002/api/user/api-key`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response (Success)**:
```json
{
  "data": {
    "api_key": "your-api-key-here",
    "user_id": 1
  }
}
```

**Response (Not Found)**:
```json
{
  "error": "API key not found"
}
```

### 3. Test POST API Key

**POST** `http://localhost:8002/api/user/api-key`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "api_key": "your-smart-nota-api-key"
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

### 4. Test DELETE API Key

**DELETE** `http://localhost:8002/api/user/api-key`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response**:
```json
{
  "data": {
    "message": "API key deleted successfully",
    "user_id": 1
  }
}
```

## Frontend Testing

1. **Login** ke aplikasi frontend
2. **Buka halaman Settings**
3. **Masukkan API key** Smart Nota
4. **Klik "Simpan & Validasi"**
5. **Refresh halaman** untuk memastikan API key tersimpan

## Troubleshooting

### Error 403 Forbidden
- Pastikan JWT token valid dan tidak expired
- Pastikan user memiliki role "admin" atau "user"
- Periksa Authorization header

### Error 401 Unauthorized
- Token tidak valid atau expired
- Header Authorization tidak ada

### Error 404 Not Found
- API key belum disimpan untuk user tersebut
- User ID tidak valid

### Database Issues
- Pastikan tabel `api_keys` sudah dibuat
- Periksa foreign key constraint ke tabel `users`
- Pastikan user ada di database

## Database Queries

### Cek tabel api_keys
```sql
SELECT * FROM api_keys;
```

### Cek user
```sql
SELECT * FROM users;
```

### Cek API key untuk user tertentu
```sql
SELECT * FROM api_keys WHERE user_id = 1;
``` 