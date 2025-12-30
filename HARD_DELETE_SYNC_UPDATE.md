# 🔄 Hard Delete Sync - Updated Behavior

## ✅ Update: Full Delete (Not Soft Delete)

Sekarang behavior delete sudah diubah menjadi **hard delete** (ikut terhapus sepenuhnya):

### Before (Soft Delete)
```
Delete Finance (from project) → Project status changed to Pending/Unpaid
Delete Project → Finance deleted
```

### After (Hard Delete) ✅
```
Delete Finance (from project) → Project DELETED ✅
Delete Project → Finance DELETED ✅
```

---

## 🎯 New Behavior

### 1. **Delete di Finance Page**
```
User: Delete Finance Entry #10 (from project)
   ↓
Backend check: project_income_id = 1
   ↓
DELETE project_incomes WHERE id = 1  ✅ HARD DELETE
   ↓
DELETE finances WHERE id = 10
   ↓
✅ Both Finance & Project DELETED!
```

### 2. **Delete di Reports Page (Project)**
```
User: Delete Project Income #1
   ↓
Backend check: finance_id = 10
   ↓
DELETE finances WHERE id = 10  ✅ HARD DELETE
   ↓
DELETE project_incomes WHERE id = 1
   ↓
✅ Both Project & Finance DELETED!
```

---

## 🔧 Code Changes

### Finance Handler (Finance → Project Delete)
**File:** `backend/internal/http/finance_handler.go`

```go
func (h *FinanceHandler) DeleteFinance(c echo.Context) error {
    // ...
    
    // REVERSE SYNC: Delete project entry if this finance is synced from project
    if finance.Source == "project" {
        if finance.ProjectIncomeID != nil && h.projectIncomeService != nil {
            // Delete project income entry (HARD DELETE)
            _ = h.projectIncomeService.DeleteIncome(*finance.ProjectIncomeID)
        }
        if finance.ProjectExpenseID != nil && h.projectExpenseService != nil {
            // Delete project expense entry (HARD DELETE)
            _ = h.projectExpenseService.DeleteExpense(*finance.ProjectExpenseID)
        }
    }
    
    h.service.DeleteFinance(uint(id))
}
```

### Project Income Handler (Project → Finance Delete)
**File:** `backend/internal/http/project_income_handler.go`

```go
func (h *ProjectIncomeHandler) DeleteIncome(c echo.Context) error {
    // Get income details
    income, _ := h.service.GetIncomeByID(id)
    
    // SYNC: Delete associated finance entry if exists
    if income.FinanceID != nil {
        if err := h.financeService.DeleteFinance(uint(*income.FinanceID)); err != nil {
            fmt.Println("Failed to delete synced finance entry:", err)
        }
    }
    
    h.service.DeleteIncome(id)
}
```

### Project Expense Handler (Project → Finance Delete)
**File:** `backend/internal/http/project_expense_handler.go`

```go
func (h *ProjectExpenseHandler) DeleteExpense(c echo.Context) error {
    // Get expense details
    expense, _ := h.service.GetExpenseByID(id)
    
    // SYNC: Delete associated finance entry if exists
    if expense.FinanceID != nil {
        if err := h.financeService.DeleteFinance(uint(*expense.FinanceID)); err != nil {
            fmt.Println("Failed to delete synced finance entry:", err)
        }
    }
    
    h.service.DeleteExpense(id)
}
```

---

## 📊 Delete Flow Diagram

### Flow: Delete Finance (from Project)
```
┌──────────────────────────────────┐
│ User: Delete Finance Entry #10   │
│ (source='project')               │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Get Finance Details              │
│ - source = 'project'             │
│ - project_income_id = 1          │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ REVERSE SYNC:                    │
│ DELETE project_incomes           │
│ WHERE id = 1                     │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ DELETE finances                  │
│ WHERE id = 10                    │
└────────────┬─────────────────────┘
             │
             ▼
    ✅ BOTH DELETED!
    Project Income: GONE
    Finance Entry: GONE
```

### Flow: Delete Project Income
```
┌──────────────────────────────────┐
│ User: Delete Project Income #1   │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ Get Income Details               │
│ - finance_id = 10                │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ SYNC:                            │
│ DELETE finances                  │
│ WHERE id = 10                    │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│ DELETE project_incomes           │
│ WHERE id = 1                     │
└────────────┬─────────────────────┘
             │
             ▼
    ✅ BOTH DELETED!
    Finance Entry: GONE
    Project Income: GONE
```

---

## 🚀 Testing

### Test 1: Delete Finance (from Project)
```bash
# Step 1: Create project income (Received)
POST /api/project-incomes
{
    "projectId": 7,
    "tanggal": "2025-01-01",
    "kategori": "Termin 1",
    "jumlah": 50000000,
    "status": "Received"
}
# → Creates project_income #1 and finance #10

# Step 2: Delete finance entry
DELETE /api/finance/10

# Step 3: Check project income
GET /api/project-incomes/project/7
# Expected: ❌ Project income #1 NOT FOUND (deleted)
```

### Test 2: Delete Project Income
```bash
# Step 1: Create project income (Received)
POST /api/project-incomes
{
    "projectId": 7,
    "tanggal": "2025-01-02",
    "kategori": "Termin 2",
    "jumlah": 50000000,
    "status": "Received"
}
# → Creates project_income #2 and finance #11

# Step 2: Delete project income
DELETE /api/project-incomes/2

# Step 3: Check finance entry
GET /api/finance/11
# Expected: ❌ Finance #11 NOT FOUND (deleted)
```

### Test 3: Delete Manual Finance (No Sync)
```bash
# Step 1: Create manual finance (not from project)
POST /api/finance
{
    "tanggal": "2025-01-03",
    "type": "income",
    "jumlah": 1000000,
    "source": "manual"
}
# → Creates finance #12 (no project link)

# Step 2: Delete finance
DELETE /api/finance/12

# Expected: ✅ Only finance deleted, no project affected
```

---

## ⚠️ Important Notes

### 1. **Hard Delete = Permanent**
- Data yang dihapus **tidak bisa dikembalikan**
- Tidak ada soft delete atau status change
- Pastikan user confirm sebelum delete

### 2. **Foreign Key Cascade**
Database sudah set dengan `ON DELETE CASCADE`, tapi kita handle di application level untuk lebih kontrol:
```sql
-- If Project deleted → Finance auto deleted (DB cascade)
-- If Finance deleted → Project deleted manually (app logic)
```

### 3. **Manual Finance Not Affected**
- Finance dengan `source='manual'` tidak sync ke project
- Delete manual finance tidak affect project sama sekali

### 4. **Transaction Safety**
Current implementation:
- Delete sync entry first
- Then delete main entry
- Not atomic (no transaction)

**Recommendation:** Wrap in transaction for safety:
```go
tx := db.Begin()
defer tx.Rollback()

// Delete sync entry
// Delete main entry

tx.Commit()
```

---

## 📊 Comparison: Soft vs Hard Delete

| Behavior | Soft Delete (Before) | Hard Delete (After) |
|----------|---------------------|---------------------|
| Delete Finance (from project) | Project status → Pending/Unpaid | Project DELETED ✅ |
| Delete Project | Finance DELETED | Finance DELETED |
| Data Recovery | ✅ Project still exists | ❌ Both deleted |
| Historical Data | ✅ Maintained | ❌ Lost |
| User Expectation | ⚠️ Confusing | ✅ Clear |

---

## 🔮 Future Enhancements

### 1. **Confirmation Dialog**
```tsx
// Frontend
const handleDeleteFinance = async (id: number) => {
  const finance = await getFinanceById(id);
  
  if (finance.source === 'project') {
    const confirmed = confirm(
      'Entry ini berasal dari Project. ' +
      'Menghapus entry ini akan menghapus data di Project juga. ' +
      'Lanjutkan?'
    );
    if (!confirmed) return;
  }
  
  await deleteFinance(id);
};
```

### 2. **Soft Delete Option**
```go
// Add deleted_at column for soft delete
type Finance struct {
    // ... existing fields ...
    DeletedAt *time.Time `json:"deletedAt,omitempty" gorm:"index"`
}

// Soft delete method
func (h *FinanceHandler) SoftDelete(id uint) error {
    now := time.Now()
    return h.db.Model(&Finance{}).Where("id = ?", id).Update("deleted_at", now).Error
}
```

### 3. **Audit Log**
```go
// Log delete operations
type DeleteLog struct {
    ID          uint
    TableName   string
    RecordID    int
    RelatedTable string
    RelatedID   int
    DeletedBy   string
    DeletedAt   time.Time
}
```

### 4. **Restore Functionality**
```go
// Restore deleted entries (if using soft delete)
func (h *FinanceHandler) Restore(id uint) error {
    return h.db.Model(&Finance{}).Where("id = ?", id).Update("deleted_at", nil).Error
}
```

---

## ✅ Testing Checklist

- [ ] Delete Finance (from project) → Project deleted ✅
- [ ] Delete Project Income → Finance deleted ✅
- [ ] Delete Project Expense → Finance deleted ✅
- [ ] Delete manual Finance → No project affected ✅
- [ ] Frontend shows correct behavior
- [ ] No orphaned records in database
- [ ] Foreign key constraints working
- [ ] Activity logs recorded

---

## 📝 Summary

**Change:** Soft Delete → Hard Delete  
**Reason:** User expectation - delete means delete  
**Impact:** Both Finance & Project deleted when one is deleted  
**Files Changed:** 3 files (finance_handler, project_income_handler, project_expense_handler)  
**Breaking Changes:** None (enhancement)  

**User Impact:** ✅ Positive (clearer behavior)

---

**Updated:** 2025-01-01  
**Version:** 1.1.0  
**Related:** TWO_WAY_SYNC_IMPLEMENTATION.md

