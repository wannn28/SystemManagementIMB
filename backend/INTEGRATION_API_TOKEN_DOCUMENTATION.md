# Integration API Token Documentation

Dokumentasi ini menjelaskan **API token integrasi** untuk aplikasi eksternal (misalnya Smart Nota Digital, BI tools, mobile app lain) yang ingin membaca data dari sistem ini.

> Penting: fitur ini **terpisah** dari Smart Nota API Key lama (`/api/user/api-key`).  
> Smart Nota API Key lama tetap dipakai untuk koneksi ke Smart Nota, tidak berubah.

---

## 1) Konsep Singkat

- User generate token dari akun sendiri di halaman Settings.
- Saat generate, user memilih scope akses:
  - `projects`
  - `finance`
  - `reports`
  - `team`
  - `inventory` (disiapkan untuk pengembangan endpoint inventory)
- Token dipakai oleh aplikasi eksternal via header:
  - `X-Integration-Token: <token>`
  - atau `Authorization: Bearer <token>`
- Endpoint eksternal akan mengecek scope sesuai modul.

Format response backend standar:

```json
{
  "status": 200,
  "data": { }
}
```

Format error:

```json
{
  "status": 403,
  "message": "scope not allowed"
}
```

---

## 2) Endpoint Manajemen Token (butuh login user/admin)

Base: `/api/user/integration-tokens`

Autentikasi: JWT login aplikasi utama (`Authorization: Bearer <jwt>`)

### 2.1 List Token

**GET** `/api/user/integration-tokens`

#### Response 200

```json
{
  "status": 200,
  "data": [
    {
      "id": 3,
      "user_id": 1,
      "name": "SmartNota Sync",
      "token_prefix": "intg_9f1a3b",
      "scopes": "{\"projects\":true,\"finance\":false,\"reports\":true,\"team\":false,\"inventory\":false}",
      "is_active": true,
      "last_used_at": "2026-03-27T09:14:00Z",
      "created_at": "2026-03-27T08:40:12Z",
      "updated_at": "2026-03-27T08:40:12Z"
    }
  ]
}
```

---

### 2.2 Generate Token Baru

**POST** `/api/user/integration-tokens`

#### Request Body

```json
{
  "name": "SmartNota Sync",
  "scopes": {
    "projects": true,
    "finance": false,
    "reports": true,
    "team": false,
    "inventory": false
  }
}
```

#### Response 201

```json
{
  "status": 201,
  "data": {
    "id": 4,
    "name": "SmartNota Sync",
    "token": "intg_8e9f....(full token hanya muncul sekali)",
    "token_prefix": "intg_8e9f3a",
    "scopes": {
      "projects": true,
      "finance": false,
      "reports": true,
      "team": false,
      "inventory": false
    },
    "is_active": true,
    "created_at": "2026-03-27T08:55:20Z"
  }
}
```

> Simpan `token` saat ini juga. Nilai full token tidak bisa diambil lagi dari list.

---

### 2.3 Update Token (nama, scope, status aktif)

**PUT** `/api/user/integration-tokens/:id`

#### Request Body

```json
{
  "name": "SmartNota Sync Updated",
  "scopes": {
    "projects": true,
    "finance": true,
    "reports": true,
    "team": false,
    "inventory": false
  },
  "is_active": true
}
```

#### Response 200

```json
{
  "status": 200,
  "data": {
    "id": 4,
    "user_id": 1,
    "name": "SmartNota Sync Updated",
    "token_prefix": "intg_8e9f3a",
    "scopes": "{\"projects\":true,\"finance\":true,\"reports\":true,\"team\":false,\"inventory\":false}",
    "is_active": true,
    "last_used_at": null,
    "created_at": "2026-03-27T08:55:20Z",
    "updated_at": "2026-03-27T09:01:02Z"
  }
}
```

---

### 2.4 Hapus Token

**DELETE** `/api/user/integration-tokens/:id`

#### Response 200

```json
{
  "status": 200,
  "data": {
    "message": "token deleted"
  }
}
```

---

## 3) Endpoint Data Eksternal (pakai Integration Token)

Base: `/api/external`

Autentikasi:
- Header rekomendasi:
  - `X-Integration-Token: <integration_token>`
- Alternatif:
  - `Authorization: Bearer <integration_token>`

---

### 3.1 Projects (scope: `projects`)

**GET** `/api/external/projects`

#### Response 200
Mengembalikan list project (`entity.Project`).

---

### 3.2 Finance (scope: `finance`)

**GET** `/api/external/finance`

#### Response 200
Mengembalikan list finance (`entity.Finance`).

---

### 3.3 Reports (scope: `reports`)

**GET** `/api/external/reports`

#### Response 200

```json
{
  "status": 200,
  "data": [
    {
      "project_id": 11,
      "name": "Cut & Fill Gajah Mada",
      "reports": {
        "daily": [],
        "weekly": [],
        "monthly": []
      }
    }
  ]
}
```

---

### 3.4 Team (scope: `team`)

**GET** `/api/external/team`

#### Response 200
Mengembalikan list member (`entity.Member`).

---

## 4) Error yang Umum

### 401 Unauthorized

- `missing integration token`
- `invalid integration token`
- `integration token inactive`

### 403 Forbidden

- `scope not allowed`  
  (token valid, tapi scope endpoint tidak diizinkan)

### 500 Internal Server Error

- Error DB/internal server.

---

## 5) Contoh cURL

### 5.1 Ambil project

```bash
curl -X GET "http://localhost:8002/api/external/projects" \
  -H "X-Integration-Token: intg_xxxxx"
```

### 5.2 Ambil finance

```bash
curl -X GET "http://localhost:8002/api/external/finance" \
  -H "Authorization: Bearer intg_xxxxx"
```

### 5.3 Generate token (dari aplikasi utama, pakai JWT)

```bash
curl -X POST "http://localhost:8002/api/user/integration-tokens" \
  -H "Authorization: Bearer <jwt_user>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SmartNota Sync",
    "scopes": {
      "projects": true,
      "finance": false,
      "reports": true,
      "team": false,
      "inventory": false
    }
  }'
```

---

## 6) Catatan Implementasi

- Token yang disimpan di DB adalah hash (`sha256`), bukan plaintext.
- `token_prefix` dipakai untuk identifikasi di UI.
- `last_used_at` diupdate saat token berhasil dipakai akses endpoint external.
- Scope `inventory` sudah disiapkan di token, endpoint external inventory bisa ditambah berikutnya.

