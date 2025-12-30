# Project Income & Expense Management Feature

## Overview
Fitur lengkap untuk tracking pemasukan dan pengeluaran per project dengan integrasi ke halaman Finance. Sistem ini memungkinkan:
- Input pemasukan per project (Termin, Progress Payment, dll)
- Input pengeluaran per project (Solar, Material, Gaji, dll)
- Analisa keuangan real-time (Revenue, Income, Expense, Profit)
- Integrasi dengan halaman Finance untuk view keseluruhan

## Database Schema

### Table: `project_incomes`
```sql
CREATE TABLE IF NOT EXISTS project_incomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    tanggal DATE NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    jumlah DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status ENUM('Received', 'Pending', 'Planned') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_tanggal (tanggal),
    INDEX idx_kategori (kategori),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: `project_expenses`
Already exists from previous implementation.

## Backend Implementation

### Entities

**ProjectIncome:**
- id, projectId, tanggal, kategori, deskripsi, jumlah
- status: 'Received' | 'Pending' | 'Planned'

**ProjectExpense:**
- id, projectId, tanggal, kategori, deskripsi, jumlah
- status: 'Paid' | 'Unpaid' | 'Pending'

**ProjectFinancialSummary (Updated):**
```go
type ProjectFinancialSummary struct {
    ProjectID         int
    ProjectName       string
    TotalRevenue      float64  // Total revenue kontrak
    TotalIncome       float64  // Total pemasukan (semua status)
    IncomeReceived    float64  // Pemasukan yang sudah received
    IncomePending     float64  // Pemasukan yang pending
    TotalExpenses     float64  // Total pengeluaran (semua status)
    ExpensesPaid      float64  // Pengeluaran yang sudah paid
    ExpensesUnpaid    float64  // Pengeluaran yang unpaid
    ActualProfit      float64  // Profit aktual (received - paid)
    EstimatedProfit   float64  // Profit estimasi (total income - total expense)
    ProgressPercent   float64  // Progress (received / total revenue * 100)
    ProfitMargin      float64  // Margin (estimated profit / total revenue * 100)
    IncomeCategories  []IncomeCategory
    ExpenseCategories []ExpenseCategory
}
```

### API Endpoints

**Project Incomes:**
- `POST /api/project-incomes` - Create income
- `GET /api/project-incomes` - Get all incomes
- `GET /api/project-incomes/:id` - Get by ID
- `GET /api/project-incomes/project/:projectId` - Get by project
- `PUT /api/project-incomes/:id` - Update income
- `DELETE /api/project-incomes/:id` - Delete income

**Project Expenses:**
- `POST /api/project-expenses` - Create expense
- `GET /api/project-expenses` - Get all expenses
- `GET /api/project-expenses/:id` - Get by ID
- `GET /api/project-expenses/project/:projectId` - Get by project
- `GET /api/project-expenses/project/:projectId/financial-summary` - Get financial analysis
- `PUT /api/project-expenses/:id` - Update expense
- `DELETE /api/project-expenses/:id` - Delete expense

## Frontend Implementation

### UI Components

#### 1. Financial Analysis Card
Menampilkan summary keuangan project:
- **Total Revenue Kontrak**: Nilai kontrak project
- **Total Pemasukan**: Total semua income (Received + Pending + Planned)
  - Received: Rp xxx
  - Pending: Rp xxx
- **Total Pengeluaran**: Total semua expense (Paid + Unpaid + Pending)
  - Paid: Rp xxx
  - Unpaid: Rp xxx
- **Profit Aktual**: Income Received - Expense Paid
- **Estimasi Profit**: Total Income - Total Expense
- **Profit Margin**: (Estimated Profit / Total Revenue) × 100%
- **Progress**: (Income Received / Total Revenue) × 100%

#### 2. Income Management
- **Tombol "Tambah Pemasukan"** (hijau)
- **Modal Form Pemasukan**:
  - Tanggal
  - Kategori (Termin 1, Termin 2, Progress Payment, dll)
  - Deskripsi
  - Jumlah
  - Status (Received/Pending/Planned)
- **Tabel Daftar Pemasukan**:
  - Tanggal, Kategori, Deskripsi, Jumlah, Status
  - Action: Edit, Delete

#### 3. Expense Management
- **Tombol "Tambah Pengeluaran"** (merah)
- **Modal Form Pengeluaran**:
  - Tanggal
  - Kategori (Solar, Material, Gaji, Sewa Alat, dll)
  - Deskripsi
  - Jumlah
  - Status (Paid/Unpaid/Pending)
- **Tabel Daftar Pengeluaran**:
  - Tanggal, Kategori, Deskripsi, Jumlah, Status
  - Action: Edit, Delete

### Status Color Coding

**Income Status:**
- Received: Green badge
- Pending: Yellow badge
- Planned: Blue badge

**Expense Status:**
- Paid: Green badge
- Unpaid: Red badge
- Pending: Yellow badge

## Usage Flow

### 1. Input Pemasukan Project
1. Buka halaman Reports
2. Klik "Show Details" pada project
3. Scroll ke Financial Analysis section
4. Klik tombol "Tambah Pemasukan" (hijau)
5. Isi form:
   - Tanggal: kapan pemasukan diterima/akan diterima
   - Kategori: Termin 1, Termin 2, Progress Payment, dll
   - Deskripsi: detail pemasukan (optional)
   - Jumlah: nominal dalam Rupiah
   - Status:
     - **Received**: Uang sudah diterima
     - **Pending**: Sedang diproses
     - **Planned**: Rencana pemasukan
6. Klik "Simpan"
7. Financial summary akan auto-update

### 2. Input Pengeluaran Project
1. Di Financial Analysis section
2. Klik tombol "Tambah Pengeluaran" (merah)
3. Isi form:
   - Tanggal: kapan pengeluaran terjadi
   - Kategori: Solar, Material, Gaji, Sewa Alat, dll
   - Deskripsi: detail pengeluaran (optional)
   - Jumlah: nominal dalam Rupiah
   - Status:
     - **Paid**: Sudah dibayar
     - **Unpaid**: Belum dibayar
     - **Pending**: Sedang diproses
4. Klik "Simpan"
5. Financial summary akan auto-update

### 3. Melihat Analisa Keuangan
Financial Analysis card menampilkan:
- **Profit Aktual**: Berapa profit yang sudah real (uang masuk - uang keluar yang sudah paid)
- **Estimasi Profit**: Estimasi profit total (semua income - semua expense)
- **Progress**: Seberapa banyak income yang sudah received vs total revenue kontrak
- **Profit Margin**: Persentase keuntungan dari total revenue

### 4. Edit/Delete Income/Expense
- Klik icon edit (pensil) untuk mengubah data
- Klik icon delete (trash) untuk menghapus data
- Financial summary akan otomatis terupdate

## Integration dengan Finance Page

### Konsep Integrasi
Semua income dan expense dari project akan:
1. Tercatat di level project (Project Reports page)
2. Terintegrasi ke Finance page untuk view keseluruhan
3. Bisa difilter berdasarkan:
   - Tanggal
   - Kategori
   - Status
   - Project

### Finance Page Features
- **Total Pemasukan**: Sum dari semua project incomes (status: Received)
- **Total Pengeluaran**: Sum dari semua project expenses (status: Paid)
- **Saldo Bersih**: Total Pemasukan - Total Pengeluaran
- **Filter & Pencarian**:
  - Filter by kategori
  - Filter by status
  - Filter by tanggal
  - Filter by project
  - Search by keterangan

## Key Metrics Explained

### 1. Total Revenue (Kontrak)
Nilai total kontrak project dari awal. Ini adalah target pemasukan maksimal.

### 2. Total Income
Total semua pemasukan yang sudah diinput (Received + Pending + Planned).
Bisa lebih besar dari Total Revenue jika ada pemasukan tambahan.

### 3. Income Received
Pemasukan yang benar-benar sudah diterima/masuk ke rekening.

### 4. Total Expenses
Total semua pengeluaran yang sudah diinput (Paid + Unpaid + Pending).

### 5. Expenses Paid
Pengeluaran yang benar-benar sudah dibayarkan.

### 6. Actual Profit
```
Actual Profit = Income Received - Expenses Paid
```
Ini adalah profit REAL yang sudah terjadi (uang masuk - uang keluar).

### 7. Estimated Profit
```
Estimated Profit = Total Income - Total Expenses
```
Ini adalah estimasi profit jika semua income diterima dan semua expense dibayar.

### 8. Profit Margin
```
Profit Margin = (Estimated Profit / Total Revenue) × 100%
```
Persentase keuntungan dari nilai kontrak.

### 9. Progress Percent
```
Progress = (Income Received / Total Revenue) × 100%
```
Seberapa banyak income yang sudah diterima vs target revenue kontrak.

## Example Scenario

### Project: "Cut and Fill Panbil Tembesi"
- **Total Revenue (Kontrak)**: Rp 1.000.000.000

### Income Records:
1. Termin 1 - Rp 300.000.000 (Received)
2. Termin 2 - Rp 300.000.000 (Received)
3. Termin 3 - Rp 400.000.000 (Pending)

**Total Income**: Rp 1.000.000.000
**Income Received**: Rp 600.000.000
**Income Pending**: Rp 400.000.000

### Expense Records:
1. Solar Panel - Rp 50.000 (Paid)
2. Material - Rp 200.000.000 (Paid)
3. Gaji Pekerja - Rp 150.000.000 (Paid)
4. Sewa Alat - Rp 100.000.000 (Unpaid)

**Total Expenses**: Rp 450.050.000
**Expenses Paid**: Rp 350.050.000
**Expenses Unpaid**: Rp 100.000.000

### Financial Analysis:
- **Actual Profit**: Rp 600.000.000 - Rp 350.050.000 = Rp 249.950.000
- **Estimated Profit**: Rp 1.000.000.000 - Rp 450.050.000 = Rp 549.950.000
- **Profit Margin**: (549.950.000 / 1.000.000.000) × 100% = 54.995%
- **Progress**: (600.000.000 / 1.000.000.000) × 100% = 60%

### Interpretation:
- Project sudah 60% selesai (dari sisi pemasukan)
- Profit aktual yang sudah real: Rp 249.950.000
- Jika semua termin dibayar, estimasi profit: Rp 549.950.000
- Profit margin sangat bagus: 54.995%
- Masih ada Rp 100.000.000 pengeluaran yang belum dibayar

## Benefits

1. **Transparency**: Lihat real-time financial status project
2. **Cash Flow Management**: Track pemasukan dan pengeluaran aktual
3. **Profit Analysis**: Tahu profit real vs estimasi
4. **Decision Making**: Data untuk keputusan bisnis
5. **Reporting**: Generate laporan keuangan per project
6. **Integration**: Semua data terintegrasi di Finance page

## Future Enhancements

1. **Export to PDF/Excel**: Export financial report
2. **Budget vs Actual**: Compare budget dengan actual spending
3. **Payment Reminders**: Notifikasi untuk unpaid expenses
4. **Invoice Generation**: Generate invoice untuk termin
5. **Multi-currency**: Support untuk currency lain
6. **Approval Workflow**: Approval untuk income/expense besar
7. **File Attachments**: Upload invoice/receipt
8. **Recurring Transactions**: Auto-create recurring income/expense
9. **Financial Forecasting**: Prediksi cash flow
10. **Tax Calculation**: Perhitungan pajak otomatis

## Notes

- Semua transaksi tercatat dengan timestamp
- Activity log untuk audit trail
- Soft delete untuk data integrity
- Real-time sync antara project dan finance
- Authentication required untuk semua endpoints
- Format angka menggunakan locale Indonesia (titik sebagai separator ribuan)

