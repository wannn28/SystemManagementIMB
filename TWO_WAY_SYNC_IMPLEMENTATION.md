# 🔄 Two-Way Sync Between Finance & Project - Complete

## ✅ Implementation Complete: Bidirectional Sync

Sekarang **Finance** dan **Project** sudah **fully synchronized**:
- ✅ Project → Finance (Auto sync saat Paid/Received)
- ✅ Finance → Project (Update/Delete ikut sync ke Project)
- ✅ Project → Finance (Delete/Update ikut sync ke Finance)

---

## 🎯 Fitur Two-Way Sync

### 1. **Project to Finance** (Sudah ada)
```
Create Project Income (Received) → Create Finance Entry
Update Project Income → Update Finance Entry
Delete Project Income → Delete Finance Entry
Change Status (Received→Pending) → Delete Finance Entry
```

### 2. **Finance to Project** (NEW!)
```
Update Finance Entry (from project) → Update Project Entry
Delete Finance Entry (from project) → Change Project Status to Pending/Unpaid
```

---

## 🗄️ Database Changes

### Migration 010: Add Sync IDs

**File:** `backend/db/migrations/010_add_sync_ids_to_finances.up.sql`

```sql
-- Add project_income_id and project_expense_id to finances
ALTER TABLE finances 
ADD COLUMN project_income_id INT NULL,
ADD COLUMN project_expense_id INT NULL,
ADD INDEX idx_project_income_id (project_income_id),
ADD INDEX idx_project_expense_id (project_expense_id);

ALTER TABLE finances
ADD CONSTRAINT fk_finances_project_income
FOREIGN KEY (project_income_id) REFERENCES project_incomes(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_finances_project_expense
FOREIGN KEY (project_expense_id) REFERENCES project_expenses(id) ON DELETE CASCADE;

-- Add finance_id to project_incomes
ALTER TABLE project_incomes
ADD COLUMN finance_id INT NULL,
ADD INDEX idx_finance_id (finance_id);

ALTER TABLE project_incomes
ADD CONSTRAINT fk_project_incomes_finance
FOREIGN KEY (finance_id) REFERENCES finances(id) ON DELETE SET NULL;

-- Add finance_id to project_expenses
ALTER TABLE project_expenses
ADD COLUMN finance_id INT NULL,
ADD INDEX idx_finance_id (finance_id);

ALTER TABLE project_expenses
ADD CONSTRAINT fk_project_expenses_finance
FOREIGN KEY (finance_id) REFERENCES finances(id) ON DELETE SET NULL;
```

### Database Schema

```
┌─────────────────┐        ┌──────────────────┐
│   finances      │        │ project_incomes  │
├─────────────────┤        ├──────────────────┤
│ id (PK)         │◄───────│ finance_id (FK)  │
│ project_id      │        │ id (PK)          │
│ project_income_id├───────►│                  │
│ project_expense_id        │ project_id       │
│ source          │        │ status           │
│ ...             │        │ ...              │
└─────────────────┘        └──────────────────┘
         │
         │                 ┌──────────────────┐
         │                 │ project_expenses │
         │                 ├──────────────────┤
         └────────────────►│ finance_id (FK)  │
                           │ id (PK)          │
                           │ project_id       │
                           │ status           │
                           │ ...              │
                           └──────────────────┘
```

---

## 📊 Entity Updates

### Finance Entity
**File:** `backend/internal/entity/finance.go`

```go
type Finance struct {
    ID               uint            `gorm:"primaryKey" json:"id"`
    // ... existing fields ...
    ProjectID        *int            `json:"projectId,omitempty" gorm:"column:project_id"`
    Source           string          `json:"source" gorm:"type:varchar(50);default:'manual'"`
    ProjectIncomeID  *int            `json:"projectIncomeId,omitempty" gorm:"column:project_income_id"`  // NEW
    ProjectExpenseID *int            `json:"projectExpenseId,omitempty" gorm:"column:project_expense_id"` // NEW
}
```

### ProjectIncome Entity
**File:** `backend/internal/entity/project_income.go`

```go
type ProjectIncome struct {
    ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
    // ... existing fields ...
    FinanceID *int      `json:"financeId,omitempty" gorm:"column:finance_id;index"` // NEW
    CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}
```

### ProjectExpense Entity
**File:** `backend/internal/entity/project_expense.go`

```go
type ProjectExpense struct {
    ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
    // ... existing fields ...
    FinanceID *int      `json:"financeId,omitempty" gorm:"column:finance_id;index"` // NEW
    CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}
```

---

## 🔧 Backend Implementation

### 1. Project Income Handler
**File:** `backend/internal/http/project_income_handler.go`

#### Create Income (Project → Finance)
```go
// AUTO SYNC: Create Finance Entry (only if Received)
if income.Status == "Received" {
    financeEntry := &entity.Finance{
        // ... fields ...
        ProjectIncomeID: &income.ID,  // Link to project_income
    }
    h.financeService.CreateFinance(financeEntry)
    
    // Save finance_id back to project_income
    financeIDInt := int(financeEntry.ID)
    income.FinanceID = &financeIDInt
}
```

#### Update Income (Project → Finance)
```go
// Create finance if status changed to Received
if oldIncome.Status != "Received" && income.Status == "Received" {
    // Create finance entry with link
}

// Delete finance if status changed from Received
if oldIncome.Status == "Received" && income.Status != "Received" {
    if oldIncome.FinanceID != nil {
        h.financeService.DeleteFinance(uint(*oldIncome.FinanceID))
    }
}

// Update finance if still Received but data changed
if oldIncome.Status == "Received" && income.Status == "Received" {
    // Update synced finance entry
}
```

### 2. Finance Handler
**File:** `backend/internal/http/finance_handler.go`

#### Update Finance (Finance → Project) - NEW!
```go
func (h *FinanceHandler) UpdateFinance(c echo.Context) error {
    // Get old finance to check if synced from project
    oldFinance, _ := h.service.GetFinanceByID(uint(id))
    
    // ... update finance ...
    
    // REVERSE SYNC: Update project entry if synced from project
    if oldFinance.Source == "project" {
        if oldFinance.ProjectIncomeID != nil {
            // Update project income
            h.projectIncomeService.UpdateIncome(*oldFinance.ProjectIncomeID, &entity.ProjectIncomeUpdateRequest{
                Tanggal:   finance.Tanggal,
                Kategori:  string(finance.Category),
                Jumlah:    finance.Jumlah,
                // ... other fields ...
            })
        }
        if oldFinance.ProjectExpenseID != nil {
            // Update project expense
            h.projectExpenseService.UpdateExpense(...)
        }
    }
}
```

#### Delete Finance (Finance → Project) - NEW!
```go
func (h *FinanceHandler) DeleteFinance(c echo.Context) error {
    finance, _ := h.service.GetFinanceByID(uint(id))
    
    // REVERSE SYNC: Change project status if synced from project
    if finance.Source == "project" {
        if finance.ProjectIncomeID != nil {
            // Change status to Pending (not fully delete)
            h.projectIncomeService.UpdateIncome(*finance.ProjectIncomeID, &entity.ProjectIncomeUpdateRequest{
                Status: "Pending",
            })
        }
        if finance.ProjectExpenseID != nil {
            // Change status to Unpaid
            h.projectExpenseService.UpdateExpense(*finance.ProjectExpenseID, &entity.ProjectExpenseUpdateRequest{
                Status: "Unpaid",
            })
        }
    }
    
    h.service.DeleteFinance(uint(id))
}
```

### 3. Route Registration
**File:** `backend/pkg/route/finance_route.go` & `backend/pkg/server/server.go`

```go
// Pass project services to finance handler
func RegisterFinanceRoutes(
    e *echo.Echo, 
    financeService service.FinanceService, 
    config config.Config, 
    activityService service.ActivityService, 
    categoryService service.FinanceCategoryService,
    projectIncomeService service.ProjectIncomeService,    // NEW
    projectExpenseService service.ProjectExpenseService,  // NEW
) {
    handler := http.NewFinanceHandler(financeService, activityService, projectIncomeService, projectExpenseService)
    // ... routes ...
}
```

---

## 🔄 Sync Flow Diagrams

### Flow 1: Create Project Income (Received)
```
┌──────────────────────────────────┐
│ User: Create Project Income      │
│ Status: Received                 │
│ Amount: 50.000.000              │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Save to project_incomes          │
│ id = 1                           │
│ status = 'Received'              │
│ finance_id = NULL (temporary)    │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Create Finance Entry             │
│ id = 10                          │
│ source = 'project'               │
│ project_income_id = 1            │
│ status = 'Paid'                  │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Update project_incomes           │
│ SET finance_id = 10              │
│ WHERE id = 1                     │
└──────────────────────────────────┘
             │
             ▼
        ✅ SYNCED!
```

### Flow 2: Update Finance (from Project)
```
┌──────────────────────────────────┐
│ User: Edit Finance Entry #10     │
│ (originated from project)        │
│ Amount: 50M → 60M                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Check: source = 'project'?       │
│ YES → project_income_id = 1      │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Update Finance Entry #10         │
│ jumlah = 60.000.000             │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ REVERSE SYNC:                    │
│ Update project_incomes #1        │
│ jumlah = 60.000.000             │
└──────────────────────────────────┘
             │
             ▼
        ✅ BOTH UPDATED!
```

### Flow 3: Delete Finance (from Project)
```
┌──────────────────────────────────┐
│ User: Delete Finance Entry #10   │
│ (originated from project)        │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Check: source = 'project'?       │
│ YES → project_income_id = 1      │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ REVERSE SYNC:                    │
│ Update project_incomes #1        │
│ status = 'Pending'               │
│ finance_id = NULL                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Delete Finance Entry #10         │
└──────────────────────────────────┘
             │
             ▼
    ✅ FINANCE DELETED!
    ⚠️  PROJECT STILL EXISTS (status changed)
```

---

## 🚀 Installation & Testing

### Step 1: Run Migration
```bash
mysql -u root -p
```

```sql
USE imbbackend;

-- Migration 009 (if not done yet)
SOURCE D:/[belajar]/[github]/SystemManagementIMB/backend/db/migrations/009_add_project_id_to_finances.up.sql;

-- Migration 010 (NEW)
SOURCE D:/[belajar]/[github]/SystemManagementIMB/backend/db/migrations/010_add_sync_ids_to_finances.up.sql;

-- Verify
DESCRIBE finances;
DESCRIBE project_incomes;
DESCRIBE project_expenses;
```

### Step 2: Restart Backend
```bash
cd D:\[belajar]\[github]\SystemManagementIMB\backend
go run cmd/main.go
```

### Step 3: Test Two-Way Sync

#### Test 1: Project → Finance (Create)
```bash
POST /api/project-incomes
{
    "projectId": 7,
    "tanggal": "2025-01-01",
    "kategori": "Termin 1",
    "jumlah": 50000000,
    "status": "Received"
}
```
**Expected:** ✅ Finance entry auto created

#### Test 2: Finance → Project (Update)
```bash
# Get finance_id from previous test (e.g., id=10)
PUT /api/finance/10
{
    "jumlah": 60000000,
    "keterangan": "Updated amount"
}
```
**Expected:** ✅ Project income also updated to 60M

#### Test 3: Finance → Project (Delete)
```bash
DELETE /api/finance/10
```
**Expected:** 
- ✅ Finance entry deleted
- ✅ Project income status changed to "Pending"
- ✅ Project income NOT deleted (still exists)

#### Test 4: Project → Finance (Status Change)
```bash
# Change project income status from Received to Pending
PUT /api/project-incomes/1
{
    "status": "Pending"
}
```
**Expected:** ✅ Finance entry auto deleted

---

## 📊 Verification Queries

### Check Sync Status
```sql
-- Show all synced entries
SELECT 
    f.id as finance_id,
    f.type,
    f.jumlah as finance_amount,
    f.source,
    f.project_income_id,
    f.project_expense_id,
    pi.id as income_id,
    pi.jumlah as income_amount,
    pi.finance_id as income_finance_link,
    pe.id as expense_id,
    pe.jumlah as expense_amount,
    pe.finance_id as expense_finance_link
FROM finances f
LEFT JOIN project_incomes pi ON f.project_income_id = pi.id
LEFT JOIN project_expenses pe ON f.project_expense_id = pe.id
WHERE f.source = 'project'
ORDER BY f.id DESC;
```

### Check Broken Links
```sql
-- Finance with missing project entries
SELECT * FROM finances 
WHERE source = 'project' 
AND project_income_id IS NOT NULL 
AND project_income_id NOT IN (SELECT id FROM project_incomes);

-- Project entries with missing finance
SELECT * FROM project_incomes 
WHERE status = 'Received' 
AND finance_id IS NOT NULL 
AND finance_id NOT IN (SELECT id FROM finances);
```

---

## ⚠️ Important Notes

### 1. **Soft Delete on Finance Delete**
- Menghapus Finance entry (from project) **TIDAK** menghapus Project entry
- Hanya mengubah status menjadi `Pending` (income) atau `Unpaid` (expense)
- Project entry tetap ada untuk historical record

### 2. **Foreign Key Constraints**
```sql
-- If Finance is deleted, project entries are NOT affected (SET NULL)
-- If Project entry is deleted, Finance entry IS deleted (CASCADE)
```

### 3. **Source Field**
- `"manual"` = Input langsung di Finance, no sync
- `"project"` = Auto sync dari Project, enable reverse sync

### 4. **Concurrent Updates**
- Jika edit Project dan Finance bersamaan, last write wins
- No conflict resolution (by design, simple implementation)

---

## 🎯 Benefits

1. **Konsistensi Data** - Finance dan Project selalu sinkron
2. **Flexibility** - Edit dari mana saja (Project atau Finance)
3. **Historical Tracking** - Delete Finance tidak hapus Project
4. **Audit Trail** - Bisa track mana entry yang berasal dari project
5. **User Friendly** - Edit di Finance page juga update Project

---

## 🔮 Future Enhancements

- [ ] Conflict resolution (optimistic locking)
- [ ] Sync history log table
- [ ] Bulk sync operations
- [ ] Sync status indicator in UI
- [ ] Real-time sync notification
- [ ] Sync error handling & retry mechanism

---

## ✅ Testing Checklist

- [ ] Migration 009 & 010 berhasil dijalankan
- [ ] Backend compile tanpa error
- [ ] Create Project Income (Received) → Finance created
- [ ] Update Project Income → Finance updated
- [ ] Delete Project Income → Finance deleted
- [ ] Update Finance (from project) → Project updated ✅
- [ ] Delete Finance (from project) → Project status changed ✅
- [ ] Create manual Finance → no project sync
- [ ] Foreign key constraints working
- [ ] Database integrity maintained

---

## 📝 Summary

**Status:** ✅ Complete  
**Files Changed:** 9 files  
**Database Migrations:** 2 (009, 010)  
**Testing:** Ready to test  
**Breaking Changes:** None (backward compatible)  

**User Impact:** Very Positive (full bidirectional sync)

---

**Created:** 2025-01-01  
**Version:** 1.0.0  
**Related Docs:** AUTO_SYNC_FINANCE_IMPLEMENTATION.md

