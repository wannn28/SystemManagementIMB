# Auto Sync Finance Implementation

## 📋 Overview
Sistem Auto Sync yang mengintegrasikan **Project Income & Expense** dengan **Finance Page**. Setiap transaksi di level project akan otomatis tersinkronisasi ke Finance.

## 🎯 Fitur Utama

### 1. **Auto Sync Project Income → Finance**
- Ketika status income = `Received`, otomatis masuk ke Finance sebagai `Income` dengan status `Paid`
- Kategori income project akan menjadi kategori di Finance
- Deskripsi otomatis: `"Project Income - [Kategori]: [Deskripsi]"`

### 2. **Auto Sync Project Expense → Finance**
- Ketika status expense = `Paid`, otomatis masuk ke Finance sebagai `Expense` dengan status `Paid`
- Kategori expense project akan menjadi kategori di Finance
- Deskripsi otomatis: `"Project Expense - [Kategori]: [Deskripsi]"`

### 3. **Tracking Source**
- Setiap entry di Finance memiliki field `source`:
  - `"manual"` = Input langsung di Finance page
  - `"project"` = Auto sync dari Project
- Field `project_id` untuk link ke project yang bersangkutan

## 🗄️ Database Changes

### Migration 009: Add Project Link to Finances

**File:** `backend/db/migrations/009_add_project_id_to_finances.up.sql`

```sql
ALTER TABLE finances 
ADD COLUMN project_id INT NULL COMMENT 'Link to project if this is project-related income/expense',
ADD COLUMN source VARCHAR(50) DEFAULT 'manual' COMMENT 'Source: manual or project',
ADD INDEX idx_project_id (project_id),
ADD INDEX idx_source (source);

ALTER TABLE finances
ADD CONSTRAINT fk_finances_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
```

**Rollback:** `backend/db/migrations/009_add_project_id_to_finances.down.sql`

```sql
ALTER TABLE finances
DROP FOREIGN KEY IF EXISTS fk_finances_project;

ALTER TABLE finances
DROP INDEX IF EXISTS idx_project_id,
DROP INDEX IF EXISTS idx_source,
DROP COLUMN IF EXISTS project_id,
DROP COLUMN IF EXISTS source;
```

## 📊 Entity Updates

### Finance Entity
**File:** `backend/internal/entity/finance.go`

```go
type Finance struct {
    ID           uint            `gorm:"primaryKey" json:"id"`
    Tanggal      string          `json:"tanggal"`
    Unit         int             `json:"unit"`
    Jumlah       float64         `json:"jumlah"`
    HargaPerUnit float64         `json:"hargaPerUnit"`
    Keterangan   string          `json:"keterangan"`
    Type         FinanceType     `gorm:"type:ENUM('income','expense')" json:"type"`
    Category     FinanceCategory `gorm:"type:varchar(100)" json:"category"`
    Status       string          `gorm:"type:ENUM('Paid','Unpaid')" json:"status"`
    ProjectID    *int            `json:"projectId,omitempty" gorm:"column:project_id"` // NEW
    Source       string          `json:"source" gorm:"type:varchar(50);default:'manual'"` // NEW
}
```

## 🔧 Backend Implementation

### 1. Project Income Handler
**File:** `backend/internal/http/project_income_handler.go`

#### Create Income (Auto Sync)
```go
func (h *ProjectIncomeHandler) CreateIncome(c echo.Context) error {
    // ... create income logic ...

    // AUTO SYNC: Create Finance Entry (only if Received)
    if income.Status == "Received" {
        financeEntry := &entity.Finance{
            Tanggal:      income.Tanggal,
            Unit:         1,
            Jumlah:       income.Jumlah,
            HargaPerUnit: income.Jumlah,
            Keterangan:   fmt.Sprintf("Project Income - %s: %s", income.Kategori, income.Deskripsi),
            Type:         entity.Income,
            Category:     entity.FinanceCategory(income.Kategori),
            Status:       "Paid",
            ProjectID:    &income.ProjectID,
            Source:       "project",
        }
        h.financeService.CreateFinance(financeEntry)
    }

    return response.Success(c, http.StatusCreated, income)
}
```

#### Update Income (Auto Sync on Status Change)
```go
func (h *ProjectIncomeHandler) UpdateIncome(c echo.Context) error {
    oldIncome, _ := h.service.GetIncomeByID(id)
    
    // ... update income logic ...

    // AUTO SYNC: If status changed from non-Received to Received
    if oldIncome.Status != "Received" && income.Status == "Received" {
        financeEntry := &entity.Finance{
            // ... same as create ...
        }
        h.financeService.CreateFinance(financeEntry)
    }

    return response.Success(c, http.StatusOK, income)
}
```

### 2. Project Expense Handler
**File:** `backend/internal/http/project_expense_handler.go`

#### Create Expense (Auto Sync)
```go
func (h *ProjectExpenseHandler) CreateExpense(c echo.Context) error {
    // ... create expense logic ...

    // AUTO SYNC: Create Finance Entry (only if Paid)
    if expense.Status == "Paid" {
        financeEntry := &entity.Finance{
            Tanggal:      expense.Tanggal,
            Unit:         1,
            Jumlah:       expense.Jumlah,
            HargaPerUnit: expense.Jumlah,
            Keterangan:   fmt.Sprintf("Project Expense - %s: %s", expense.Kategori, expense.Deskripsi),
            Type:         entity.Expense,
            Category:     entity.FinanceCategory(expense.Kategori),
            Status:       "Paid",
            ProjectID:    &expense.ProjectID,
            Source:       "project",
        }
        h.financeService.CreateFinance(financeEntry)
    }

    return response.Success(c, http.StatusCreated, expense)
}
```

#### Update Expense (Auto Sync on Status Change)
```go
func (h *ProjectExpenseHandler) UpdateExpense(c echo.Context) error {
    oldExpense, _ := h.service.GetExpenseByID(id)
    
    // ... update expense logic ...

    // AUTO SYNC: If status changed from non-Paid to Paid
    if oldExpense.Status != "Paid" && expense.Status == "Paid" {
        financeEntry := &entity.Finance{
            // ... same as create ...
        }
        h.financeService.CreateFinance(financeEntry)
    }

    return response.Success(c, http.StatusOK, expense)
}
```

### 3. Route Registration
**File:** `backend/pkg/server/server.go`

```go
// Initialize finance service first (needed by project routes)
financeRepo := repository.NewFinanceRepository(db)
financeService := service.NewFinanceService(financeRepo)

// Register routes with finance service
route.RegisterProjectExpenseRoutes(e, projectExpenseService, activityService, financeService, cfg)
route.RegisterProjectIncomeRoutes(e, projectIncomeService, activityService, financeService, cfg)
```

## 🎨 Frontend Display (Future Enhancement)

### Finance Page - Show Project Source
```tsx
{finance.source === 'project' && (
    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
        From Project #{finance.projectId}
    </span>
)}
```

### Filter by Source
```tsx
<select onChange={(e) => setSourceFilter(e.target.value)}>
    <option value="all">All Sources</option>
    <option value="manual">Manual Entry</option>
    <option value="project">From Projects</option>
</select>
```

## 📝 Sync Logic Flow

### Income Flow
```
Project Income Created (Status: Planned/Pending)
    ↓
No Sync to Finance
    ↓
Status Changed to "Received"
    ↓
✅ Auto Create Finance Entry (Type: Income, Status: Paid)
    ↓
Visible in Finance Page
```

### Expense Flow
```
Project Expense Created (Status: Unpaid/Pending)
    ↓
No Sync to Finance
    ↓
Status Changed to "Paid"
    ↓
✅ Auto Create Finance Entry (Type: Expense, Status: Paid)
    ↓
Visible in Finance Page
```

## 🚀 Installation Steps

### 1. Run Database Migration
```bash
# Connect to MySQL
mysql -u root -p imbbackend

# Run migration
source backend/db/migrations/009_add_project_id_to_finances.up.sql
```

### 2. Restart Backend
```bash
cd backend
go run cmd/main.go
```

### 3. Test Auto Sync

#### Test Income Sync
```bash
# Create Project Income with status "Received"
POST http://localhost:8002/api/project-incomes
{
    "projectId": 1,
    "tanggal": "2025-01-01",
    "kategori": "Termin 1",
    "deskripsi": "Pembayaran termin pertama",
    "jumlah": 50000000,
    "status": "Received"
}

# Check Finance page - should see new income entry
GET http://localhost:8002/api/finances
```

#### Test Expense Sync
```bash
# Create Project Expense with status "Paid"
POST http://localhost:8002/api/project-expenses
{
    "projectId": 1,
    "tanggal": "2025-01-02",
    "kategori": "Material",
    "deskripsi": "Pembelian semen",
    "jumlah": 5000000,
    "status": "Paid"
}

# Check Finance page - should see new expense entry
GET http://localhost:8002/api/finances
```

## 🔍 Verification Queries

### Check Synced Entries
```sql
-- Show all project-synced finance entries
SELECT * FROM finances WHERE source = 'project';

-- Show finance entries for specific project
SELECT * FROM finances WHERE project_id = 1;

-- Compare project income with finance
SELECT 
    pi.id as income_id,
    pi.kategori,
    pi.jumlah,
    pi.status,
    f.id as finance_id,
    f.jumlah as finance_amount
FROM project_incomes pi
LEFT JOIN finances f ON f.project_id = pi.project_id AND f.source = 'project'
WHERE pi.project_id = 1 AND pi.status = 'Received';
```

## ⚠️ Important Notes

### 1. **Sync Only on Paid/Received Status**
- Income hanya sync ketika status = `Received`
- Expense hanya sync ketika status = `Paid`
- Status `Pending`, `Planned`, `Unpaid` tidak akan sync

### 2. **One-Way Sync (Project → Finance)**
- Sync hanya dari Project ke Finance
- Edit di Finance page tidak akan update Project
- Delete di Finance page tidak akan delete di Project

### 3. **Future Enhancements**
- [ ] Two-way sync (Finance ↔ Project)
- [ ] Bulk sync for existing data
- [ ] Sync on status change from Paid/Received to other status (delete finance entry)
- [ ] Show project link in Finance page
- [ ] Filter finance by project source

## 📊 Benefits

1. **Konsistensi Data**: Finance page selalu update dengan data project terbaru
2. **Efisiensi**: Tidak perlu input manual 2x (di Project dan Finance)
3. **Traceability**: Bisa track mana entry yang dari project via `source` dan `project_id`
4. **Analisis Lengkap**: Finance page menampilkan total keuangan perusahaan (manual + project)

## 🎯 Testing Checklist

- [ ] Migration 009 berhasil dijalankan
- [ ] Backend compile tanpa error
- [ ] Create Project Income (Received) → muncul di Finance
- [ ] Create Project Income (Pending) → tidak muncul di Finance
- [ ] Update Income status Pending → Received → muncul di Finance
- [ ] Create Project Expense (Paid) → muncul di Finance
- [ ] Create Project Expense (Unpaid) → tidak muncul di Finance
- [ ] Update Expense status Unpaid → Paid → muncul di Finance
- [ ] Finance page menampilkan semua entry (manual + project)
- [ ] Field `source` dan `project_id` terisi dengan benar

---

**Status:** ✅ Backend Implementation Complete
**Next Step:** Run migration dan test fitur

