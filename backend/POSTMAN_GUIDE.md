# 📋 Panduan Penggunaan Postman Collection

## 🚀 Cara Import Collection

### 1. Import Collection
1. Buka Postman
2. Klik **Import** di pojok kiri atas
3. Pilih file `SystemManagementIMB_Collection.json`
4. Klik **Import**

### 2. Import Environment
1. Klik **Import** lagi
2. Pilih file `SystemManagementIMB_Environment.json`
3. Klik **Import**

### 3. Set Environment
1. Di dropdown environment (kanan atas), pilih **"System Management IMB Environment"**

## 🔧 Setup Awal

### 1. Pastikan Server Berjalan
```bash
# Jalankan server backend
go run cmd/main.go
```

### 2. Test Koneksi
- Buka request **"Login"** di folder **"🔐 Authentication"**
- Klik **Send**
- Pastikan response status 200

## 🔐 Langkah-langkah Testing

### Step 1: Login
1. Buka request **"Login"**
2. Body JSON:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```
3. Klik **Send**
4. Token akan otomatis tersimpan di environment

### Step 2: Test CRUD Operations
Setelah login berhasil, Anda bisa test semua endpoint:

## 📊 Kategori Endpoint

### 🔐 Authentication
- **POST /login** - Login untuk mendapatkan token

### 👥 User Management
- **POST /admin/users** - Buat user baru
- **GET /admin/users** - Ambil semua user
- **GET /admin/users/:id** - Ambil user by ID
- **PUT /admin/users/:id** - Update user
- **DELETE /admin/users/:id** - Hapus user

### 💰 Finance Management
- **POST /finance** - Buat record keuangan
- **GET /finance** - Ambil semua data keuangan
- **GET /finance/:id** - Ambil data keuangan by ID
- **PUT /finance/:id** - Update data keuangan
- **DELETE /finance/:id** - Hapus data keuangan
- **GET /finance/summary** - Ringkasan keuangan
- **GET /finance/monthly** - Perbandingan bulanan

### 📦 Inventory Management

#### Categories:
- **GET /api/inventory/categories** - Ambil semua kategori
- **POST /api/inventory/categories** - Buat kategori baru
- **GET /api/inventory/categories/:id** - Ambil kategori by ID
- **PUT /api/inventory/categories/:id** - Update kategori
- **DELETE /api/inventory/categories/:id** - Hapus kategori

#### Data:
- **GET /api/inventory/categories/:categoryId/data** - Ambil data kategori
- **POST /api/inventory/categories/:categoryId/data** - Buat data baru
- **PUT /api/inventory/data/:id** - Update data
- **DELETE /api/inventory/data/:id** - Hapus data

#### Images:
- **POST /api/inventory/data/:dataId/images** - Upload gambar
- **DELETE /api/inventory/data/:dataId/images/:imageName** - Hapus gambar

### 👤 Member Management

#### Members:
- **POST /members** - Buat member baru
- **GET /members** - Ambil semua member
- **GET /members/count** - Hitung jumlah member
- **GET /members/:id** - Ambil member by ID
- **PUT /members/:id** - Update member
- **DELETE /members/:id** - Hapus member
- **POST /members/:id/profile** - Upload foto profil
- **POST /members/:id/documents** - Upload dokumen
- **DELETE /members/:id/documents/:fileName** - Hapus dokumen

#### Salaries:
- **POST /members/:id/salaries** - Buat gaji
- **GET /members/:id/salaries** - Ambil gaji member
- **PUT /members/:id/salaries/:salaryId** - Update gaji
- **DELETE /members/:id/salaries/:salaryId** - Hapus gaji

#### Salary Documents:
- **POST /salaries/:id/documents** - Upload dokumen gaji
- **DELETE /salaries/:id/documents/:fileName** - Hapus dokumen gaji

#### Salary Details:
- **POST /salaries/:id/details** - Buat detail gaji
- **GET /salaries/:id/details** - Ambil detail gaji
- **PUT /salaries/:id/details/:detailId** - Update detail gaji
- **DELETE /salaries/:id/details/:detailId** - Hapus detail gaji

#### Kasbon:
- **POST /salaries/:salaryId/kasbons** - Buat kasbon
- **GET /salaries/:salaryId/kasbons** - Ambil kasbon
- **PUT /kasbons/:id** - Update kasbon
- **DELETE /kasbons/:id** - Hapus kasbon

### 📊 Activities
- **GET /activities** - Ambil aktivitas terbaru

### 🏗️ Project Management
- **POST /projects** - Buat proyek baru
- **GET /projects** - Ambil semua proyek
- **GET /projects/:id** - Ambil proyek by ID
- **GET /projects/count** - Hitung jumlah proyek
- **PUT /projects/:id** - Update proyek
- **DELETE /projects/:id** - Hapus proyek

## 📝 Contoh Data untuk Testing

### Create User
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "admin"
}
```

### Create Finance
```json
{
  "date": "2024-01-15",
  "description": "Pembayaran proyek",
  "amount": 5000000,
  "type": "income",
  "category": "project_payment"
}
```

### Create Member
```json
{
  "name": "Ahmad Rizki",
  "email": "ahmad@example.com",
  "phone": "081234567890",
  "address": "Jl. Sudirman No. 123",
  "position": "Developer",
  "join_date": "2024-01-01",
  "salary": 5000000
}
```

### Create Project
```json
{
  "name": "Website E-Commerce",
  "description": "Pengembangan website e-commerce untuk client",
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "budget": 50000000,
  "status": "in_progress"
}
```

## 🔍 Tips Testing

### 1. Urutan Testing
1. **Login** dulu untuk dapat token
2. Test **Create** operations
3. Test **Read** operations
4. Test **Update** operations
5. Test **Delete** operations

### 2. File Upload
- Untuk upload file, gunakan **form-data** di body
- Pilih file dari komputer Anda

### 3. ID Management
- Setelah create, catat ID yang dikembalikan
- Gunakan ID tersebut untuk update/delete

### 4. Error Handling
- Perhatikan response status code
- 200 = Success
- 400 = Bad Request
- 401 = Unauthorized
- 404 = Not Found
- 500 = Internal Server Error

## 🛠️ Troubleshooting

### Token Expired
- Login ulang untuk dapat token baru

### Connection Error
- Pastikan server berjalan di `http://localhost:8080`
- Cek firewall/antivirus

### File Upload Error
- Pastikan file tidak terlalu besar
- Format file harus sesuai (jpg, png, pdf)

### Database Error
- Pastikan database terhubung
- Cek migration sudah dijalankan

## 📞 Support
Jika ada masalah, cek:
1. Server logs
2. Database connection
3. Environment variables
4. File permissions untuk upload 