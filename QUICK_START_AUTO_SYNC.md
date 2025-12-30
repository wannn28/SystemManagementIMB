# 🚀 Quick Start: Auto Sync Finance

## Langkah-langkah Setup

### 1️⃣ Jalankan Database Migration

Buka terminal MySQL dan jalankan:

```bash
mysql -u root -p
```

Masukkan password, lalu:

```sql
USE imbbackend;

-- Run migration
SOURCE D:/[belajar]/[github]/SystemManagementIMB/backend/db/migrations/009_add_project_id_to_finances.up.sql;

-- Verify migration
DESCRIBE finances;
```

Pastikan kolom `project_id` dan `source` sudah ada.

### 2️⃣ Restart Backend

```bash
cd D:\[belajar]\[github]\SystemManagementIMB\backend
go run cmd/main.go
```

Tunggu sampai muncul:
```
Server running on :8002
```

### 3️⃣ Test Auto Sync

#### Test 1: Create Project Income (Received)

Buka Postman atau gunakan curl:

```bash
POST http://localhost:8002/api/project-incomes
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json

Body:
{
    "projectId": 7,
    "tanggal": "2025-01-01",
    "kategori": "Termin 1",
    "deskripsi": "Pembayaran termin pertama",
    "jumlah": 50000000,
    "status": "Received"
}
```

**Expected Result:**
- ✅ Project income created
- ✅ Finance entry auto created (type: income, status: paid, source: project)

#### Test 2: Create Project Income (Pending) - Should NOT Sync

```bash
POST http://localhost:8002/api/project-incomes
Body:
{
    "projectId": 7,
    "tanggal": "2025-01-02",
    "kategori": "Termin 2",
    "deskripsi": "Pembayaran termin kedua (belum diterima)",
    "jumlah": 50000000,
    "status": "Pending"
}
```

**Expected Result:**
- ✅ Project income created
- ❌ Finance entry NOT created (karena status bukan Received)

#### Test 3: Create Project Expense (Paid)

```bash
POST http://localhost:8002/api/project-expenses
Body:
{
    "projectId": 7,
    "tanggal": "2025-01-03",
    "kategori": "Material",
    "deskripsi": "Pembelian semen 100 sak",
    "jumlah": 5000000,
    "status": "Paid"
}
```

**Expected Result:**
- ✅ Project expense created
- ✅ Finance entry auto created (type: expense, status: paid, source: project)

#### Test 4: Update Income Status (Pending → Received)

```bash
# Ambil ID dari Test 2
PUT http://localhost:8002/api/project-incomes/{id}
Body:
{
    "status": "Received"
}
```

**Expected Result:**
- ✅ Project income updated
- ✅ Finance entry auto created (karena status berubah jadi Received)

### 4️⃣ Verify di Finance Page

Buka browser:
```
http://localhost:5173/finance
```

Anda harus melihat:
- Entry dari Test 1 (Income, Rp 50.000.000)
- Entry dari Test 3 (Expense, Rp 5.000.000)
- Entry dari Test 4 (Income, Rp 50.000.000)

Total: 2 Income entries, 1 Expense entry

### 5️⃣ Verify di Database

Jalankan query test:

```bash
mysql -u root -p imbbackend < TEST_AUTO_SYNC.sql
```

Atau manual:

```sql
-- Check synced entries
SELECT 
    f.id,
    f.tanggal,
    f.type,
    f.category,
    f.jumlah,
    f.source,
    f.project_id,
    p.name as project_name
FROM finances f
LEFT JOIN projects p ON f.project_id = p.id
WHERE f.source = 'project'
ORDER BY f.id DESC;
```

## ✅ Checklist Verification

- [ ] Migration 009 berhasil (kolom `project_id` dan `source` ada)
- [ ] Backend running tanpa error
- [ ] Test 1: Income (Received) → muncul di Finance ✅
- [ ] Test 2: Income (Pending) → tidak muncul di Finance ✅
- [ ] Test 3: Expense (Paid) → muncul di Finance ✅
- [ ] Test 4: Update status → muncul di Finance ✅
- [ ] Finance page menampilkan entry dengan benar
- [ ] Database query menunjukkan `source = 'project'`

## 🎯 Cara Kerja Auto Sync

### Income Sync Logic
```
Create/Update Project Income
    ↓
Check Status
    ↓
Status = "Received"? 
    ├─ YES → Create Finance Entry (Income, Paid)
    └─ NO  → Skip sync
```

### Expense Sync Logic
```
Create/Update Project Expense
    ↓
Check Status
    ↓
Status = "Paid"? 
    ├─ YES → Create Finance Entry (Expense, Paid)
    └─ NO  → Skip sync
```

## 📊 Contoh Data Flow

### Skenario: Project Konstruksi Rumah

**1. Input di Project Income:**
- Termin 1: Rp 50.000.000 (Received) → ✅ Sync ke Finance
- Termin 2: Rp 50.000.000 (Pending) → ❌ Tidak sync
- Termin 3: Rp 50.000.000 (Planned) → ❌ Tidak sync

**2. Input di Project Expense:**
- Material: Rp 20.000.000 (Paid) → ✅ Sync ke Finance
- Upah: Rp 15.000.000 (Unpaid) → ❌ Tidak sync
- Sewa Alat: Rp 10.000.000 (Paid) → ✅ Sync ke Finance

**3. Hasil di Finance Page:**
- Income: Rp 50.000.000 (1 entry)
- Expense: Rp 30.000.000 (2 entries)
- Net: Rp 20.000.000

**4. Hasil di Project Financial Summary:**
- Total Income: Rp 150.000.000 (semua termin)
- Income Received: Rp 50.000.000
- Total Expense: Rp 45.000.000 (semua expense)
- Expense Paid: Rp 30.000.000
- Actual Profit: Rp 20.000.000 (Received - Paid)

## 🔧 Troubleshooting

### Problem: Finance entry tidak muncul

**Cek:**
1. Status income/expense sudah `Received`/`Paid`?
2. Backend running?
3. Ada error di backend console?
4. Migration 009 sudah dijalankan?

**Solution:**
```bash
# Check backend logs
cd backend
go run cmd/main.go

# Check database
mysql -u root -p
USE imbbackend;
SELECT * FROM finances WHERE source = 'project';
```

### Problem: Duplicate entries di Finance

**Cause:** Mungkin API dipanggil 2x atau sync logic dijalankan 2x

**Solution:**
```sql
-- Delete duplicates (keep latest)
DELETE f1 FROM finances f1
INNER JOIN finances f2 
WHERE f1.id < f2.id 
  AND f1.project_id = f2.project_id
  AND f1.source = 'project'
  AND f1.tanggal = f2.tanggal
  AND f1.jumlah = f2.jumlah;
```

### Problem: Migration error

**Error:** `Table 'finances' doesn't exist`

**Solution:**
```sql
-- Check if table exists
SHOW TABLES LIKE 'finances';

-- If not exist, create it first (check previous migrations)
```

## 📝 Notes

1. **One-Way Sync**: Project → Finance only
2. **Status Trigger**: Hanya `Received` dan `Paid` yang sync
3. **Source Tracking**: Semua entry punya field `source` dan `project_id`
4. **No Delete Sync**: Delete di project tidak delete di finance (by design)

## 🎉 Success Indicators

Jika berhasil, Anda akan melihat:

1. ✅ Finance page menampilkan data dari project
2. ✅ Keterangan entry: "Project Income - ..." atau "Project Expense - ..."
3. ✅ Database: `source = 'project'` dan `project_id` terisi
4. ✅ Total di Finance = Total Received Income + Total Paid Expense dari semua project

---

**Happy Testing! 🚀**

Jika ada masalah, cek file `AUTO_SYNC_FINANCE_IMPLEMENTATION.md` untuk detail lengkap.

