# Project Expense Tracking & Financial Analysis Feature

## Overview
Fitur ini menambahkan kemampuan tracking pengeluaran project dan analisa keuangan yang komprehensif di halaman Project Reports. Dengan fitur ini, pengguna dapat:
- Mencatat semua pengeluaran per project
- Melihat analisa keuangan project (revenue vs expense)
- Menganalisis profitabilitas project
- Melihat breakdown pengeluaran per kategori

## Backend Implementation

### 1. Database Schema
File: `backend/db/migrations/007_create_project_expenses_table.up.sql`

Tabel `project_expenses` dengan struktur:
- `id`: Primary key
- `project_id`: Foreign key ke tabel projects
- `tanggal`: Tanggal pengeluaran
- `kategori`: Kategori pengeluaran (e.g., Solar, Sewa Alat, Material, Gaji)
- `deskripsi`: Deskripsi detail pengeluaran
- `jumlah`: Jumlah pengeluaran (DECIMAL)
- `status`: Status pembayaran (Paid, Unpaid, Pending)
- `created_at` & `updated_at`: Timestamps

### 2. Entity Layer
File: `backend/internal/entity/project_expense.go`

**Entities:**
- `ProjectExpense`: Main entity untuk pengeluaran
- `ProjectExpenseCreateRequest`: Request DTO untuk create
- `ProjectExpenseUpdateRequest`: Request DTO untuk update
- `ProjectFinancialSummary`: Summary financial analysis
- `ExpenseCategory`: Breakdown per kategori

**ProjectFinancialSummary Fields:**
- `totalRevenue`: Total pendapatan project
- `totalExpenses`: Total pengeluaran
- `expensesPaid`: Pengeluaran yang sudah dibayar
- `expensesUnpaid`: Pengeluaran yang belum dibayar
- `estimatedProfit`: Estimasi profit (revenue - expenses)
- `progressPercent`: Progress project
- `profitMargin`: Margin profit dalam persen
- `expenseCategories`: Array breakdown per kategori

### 3. Repository Layer
File: `backend/internal/repository/project_expense_repository.go`

**Methods:**
- `Create(expense)`: Tambah pengeluaran baru
- `Update(expense)`: Update pengeluaran
- `Delete(id)`: Hapus pengeluaran
- `FindByID(id)`: Get expense by ID
- `FindByProjectID(projectID)`: Get all expenses for a project
- `FindAll()`: Get all expenses
- `GetFinancialSummary(projectID)`: Generate financial analysis

### 4. Service Layer
File: `backend/internal/service/project_expense_service.go`

Business logic layer yang menangani validasi dan orchestration.

### 5. HTTP Handler
File: `backend/internal/http/project_expense_handler.go`

**Endpoints:**
- `POST /api/project-expenses`: Create expense
- `GET /api/project-expenses`: Get all expenses
- `GET /api/project-expenses/:id`: Get expense by ID
- `GET /api/project-expenses/project/:projectId`: Get expenses by project
- `GET /api/project-expenses/project/:projectId/financial-summary`: Get financial analysis
- `PUT /api/project-expenses/:id`: Update expense
- `DELETE /api/project-expenses/:id`: Delete expense

### 6. Routing
File: `backend/pkg/route/project_expense_route.go`

Routing configuration dengan middleware authentication.

### 7. Server Integration
File: `backend/pkg/server/server.go`

Integration of repository, service, dan routes ke main server.

## Frontend Implementation

### 1. API Client
File: `frontend/src/api/projectExpenses.ts`

**TypeScript Interfaces:**
```typescript
interface ProjectExpense {
  id: number;
  projectId: number;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  status: 'Paid' | 'Unpaid' | 'Pending';
}

interface ProjectFinancialSummary {
  projectId: number;
  projectName: string;
  totalRevenue: number;
  totalExpenses: number;
  expensesPaid: number;
  expensesUnpaid: number;
  estimatedProfit: number;
  progressPercent: number;
  profitMargin: number;
  expenseCategories: ExpenseCategory[];
}
```

**API Methods:**
- `createExpense(data)`: Tambah pengeluaran
- `updateExpense(id, data)`: Update pengeluaran
- `deleteExpense(id)`: Hapus pengeluaran
- `getExpenseById(id)`: Get expense by ID
- `getAllExpenses()`: Get all expenses
- `getExpensesByProjectId(projectId)`: Get expenses by project
- `getFinancialSummary(projectId)`: Get financial analysis

### 2. UI Components in Reports Page
File: `frontend/src/pages/Reports.tsx`

**New Features Added:**

#### A. Financial Analysis Card
Menampilkan summary keuangan project:
- Total Revenue
- Total Pengeluaran (dengan breakdown Paid/Unpaid)
- Estimasi Profit
- Profit Margin
- Breakdown Pengeluaran per Kategori

#### B. Expense Modal
Modal form untuk tambah/edit pengeluaran:
- Input tanggal
- Input kategori (freetext)
- Input deskripsi
- Input jumlah
- Dropdown status pembayaran

#### C. Expense List Table
Tabel yang menampilkan semua pengeluaran project:
- Tanggal
- Kategori
- Deskripsi
- Jumlah
- Status (dengan badge warna)
- Action buttons (Edit & Delete)

#### D. State Management
New states added:
```typescript
const [projectExpenses, setProjectExpenses] = useState<Record<number, ProjectExpense[]>>({});
const [financialSummaries, setFinancialSummaries] = useState<Record<number, ProjectFinancialSummary>>({});
const [showExpenseModal, setShowExpenseModal] = useState<number | null>(null);
const [expenseForm, setExpenseForm] = useState({...});
const [editingExpense, setEditingExpense] = useState<ProjectExpense | null>(null);
```

## Usage Flow

### 1. Melihat Financial Analysis
1. Buka halaman Reports
2. Pilih project dengan klik "Show Details"
3. Financial Analysis card akan muncul di bagian atas
4. Lihat summary: Revenue, Expenses, Profit, dan Margin
5. Lihat breakdown pengeluaran per kategori

### 2. Menambah Pengeluaran
1. Klik tombol "Tambah Pengeluaran" di Financial Analysis card
2. Modal form akan muncul
3. Isi form:
   - Tanggal pengeluaran
   - Kategori (e.g., Solar, Sewa Alat, Material)
   - Deskripsi (optional)
   - Jumlah (dalam Rupiah)
   - Status pembayaran
4. Klik "Simpan"
5. Financial summary akan otomatis terupdate

### 3. Edit Pengeluaran
1. Di tabel expense list, klik icon edit (pensil)
2. Modal form akan muncul dengan data yang sudah terisi
3. Edit field yang diperlukan
4. Klik "Update"

### 4. Hapus Pengeluaran
1. Di tabel expense list, klik icon delete (trash)
2. Konfirmasi penghapusan
3. Financial summary akan otomatis terupdate

## Key Features

### 1. Real-time Financial Analysis
Setiap kali expense ditambah/edit/hapus, financial summary langsung terupdate menampilkan:
- Total expenses terbaru
- Estimated profit
- Profit margin
- Breakdown per kategori

### 2. Expense Categorization
Sistem mendukung kategori pengeluaran freetext seperti:
- Solar (panel surya)
- Sewa Alat
- Material Bangunan
- Gaji Pekerja
- Transportasi
- dll.

### 3. Payment Status Tracking
Tracking status pembayaran dengan 3 status:
- **Paid**: Sudah dibayar (hijau)
- **Unpaid**: Belum dibayar (merah)
- **Pending**: Sedang diproses (kuning)

### 4. Profit Analysis
Menghitung:
- **Estimated Profit** = Total Revenue - Total Expenses
- **Profit Margin** = (Estimated Profit / Total Revenue) × 100%

### 5. Responsive Design
UI dirancang responsive dengan:
- Grid layout yang adaptive
- Modal dengan smooth animations
- Color-coded status badges
- Hover effects untuk better UX

## Activity Logging
Setiap operasi expense akan dicatat di activity log:
- Create: "Pengeluaran Proyek Baru - {kategori} - Rp {jumlah}"
- Update: "Update Pengeluaran Proyek - {kategori} - Rp {jumlah}"
- Delete: "Hapus Pengeluaran Proyek - {kategori} - Rp {jumlah}"

## Data Validation

### Backend Validation
- `projectId` harus valid dan > 0
- `tanggal` tidak boleh kosong
- `kategori` tidak boleh kosong
- `jumlah` harus > 0
- `status` harus salah satu dari: Paid, Unpaid, Pending

### Frontend Validation
- Form validation sebelum submit
- Confirmation dialog untuk delete
- Error handling dengan alert messages

## Color Scheme
- **Revenue**: Blue gradient (#3B82F6 to #4F46E5)
- **Expenses**: Red (#DC2626)
- **Profit (positive)**: Green (#059669)
- **Profit (negative)**: Red (#DC2626)
- **Paid Status**: Green badge
- **Unpaid Status**: Red badge
- **Pending Status**: Yellow badge

## Database Indexes
Untuk performance optimization:
- `idx_project_id`: Index pada project_id untuk fast lookup
- `idx_tanggal`: Index pada tanggal untuk sorting
- `idx_kategori`: Index pada kategori untuk grouping
- `idx_status`: Index pada status untuk filtering

## Foreign Key Constraint
- `project_id` dengan CASCADE delete: Jika project dihapus, semua expenses ikut terhapus

## Migration
Run migration untuk membuat tabel:
```bash
# Up migration
migrate -path backend/db/migrations -database "mysql://..." up

# Down migration (jika perlu rollback)
migrate -path backend/db/migrations -database "mysql://..." down 1
```

## Testing Checklist

### Backend Testing
- [ ] Create expense dengan data valid
- [ ] Create expense dengan data invalid (validasi error)
- [ ] Get expenses by project ID
- [ ] Update expense
- [ ] Delete expense
- [ ] Get financial summary
- [ ] Check foreign key cascade delete

### Frontend Testing
- [ ] Load financial summary saat buka project details
- [ ] Tambah expense baru
- [ ] Edit expense existing
- [ ] Delete expense
- [ ] Validasi form input
- [ ] Check UI responsiveness
- [ ] Check color coding status
- [ ] Verify calculations (profit, margin, totals)

## Future Enhancements
Potential improvements:
1. **Export to PDF/Excel**: Export financial report
2. **Expense Categories Master**: Predefined categories dengan autocomplete
3. **Budget Planning**: Set budget per kategori dan tracking
4. **Payment Reminders**: Notification untuk unpaid expenses
5. **Expense Approval Flow**: Approval workflow untuk expenses besar
6. **File Attachments**: Upload invoice/receipt untuk setiap expense
7. **Multi-currency Support**: Support untuk expenses dalam currency berbeda
8. **Time-based Analysis**: Grafik expenses over time
9. **Expense vs Budget Chart**: Visualisasi perbandingan
10. **Vendor Management**: Link expenses ke vendor/supplier

## Notes
- Fitur ini fully integrated dengan existing activity logging system
- Authentication required untuk semua endpoints
- Real-time data sync antara expense list dan financial summary
- UI menggunakan Tailwind CSS dengan consistent design system

