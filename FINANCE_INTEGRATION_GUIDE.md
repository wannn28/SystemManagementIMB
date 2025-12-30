# Finance Integration Guide

## Overview
Panduan untuk mengintegrasikan Project Income & Expense dengan Finance page.

## Current Status

### Project-Level (Reports Page)
✅ **Sudah Ada:**
- Input pemasukan per project
- Input pengeluaran per project
- Financial analysis per project
- Tabel daftar income & expense

### Finance-Level (Finance Page)
❌ **Belum Terintegrasi:**
- Finance page masih sistem terpisah
- Tidak otomatis sync dengan project income/expense

## Integration Options

### Option 1: Manual Sync (Recommended untuk MVP)
User input di 2 tempat:
1. **Project Level**: Input di Reports page untuk tracking per project
2. **Finance Level**: Input di Finance page untuk accounting keseluruhan

**Pros:**
- Simple, tidak perlu ubah banyak code
- Finance page tetap independent
- Flexibility tinggi

**Cons:**
- Double entry (input 2x)
- Bisa tidak sinkron

### Option 2: Auto Sync (Recommended untuk Production)
Setiap input di Project Level otomatis create entry di Finance.

**Implementation Steps:**

#### 1. Update Project Income Handler
```go
// backend/internal/http/project_income_handler.go

func (h *ProjectIncomeHandler) CreateIncome(c echo.Context) error {
    // ... existing code ...
    
    income, err := h.service.CreateIncome(&req)
    if err != nil {
        return response.Error(c, http.StatusBadRequest, err)
    }
    
    // AUTO SYNC: Create Finance Entry
    financeEntry := entity.Finance{
        Type:       entity.Income,
        Tanggal:    income.Tanggal,
        Kategori:   income.Kategori,
        Keterangan: fmt.Sprintf("Project Income - %s", income.Deskripsi),
        Jumlah:     income.Jumlah,
        ProjectID:  &income.ProjectID, // Link to project
    }
    
    if err := h.financeService.CreateFinance(&financeEntry); err != nil {
        // Log error but don't fail the request
        fmt.Println("Failed to sync to finance:", err)
    }
    
    // ... rest of code ...
}
```

#### 2. Update Project Expense Handler
```go
// backend/internal/http/project_expense_handler.go

func (h *ProjectExpenseHandler) CreateExpense(c echo.Context) error {
    // ... existing code ...
    
    expense, err := h.service.CreateExpense(&req)
    if err != nil {
        return response.Error(c, http.StatusBadRequest, err)
    }
    
    // AUTO SYNC: Create Finance Entry
    financeEntry := entity.Finance{
        Type:       entity.Expense,
        Tanggal:    expense.Tanggal,
        Kategori:   expense.Kategori,
        Keterangan: fmt.Sprintf("Project Expense - %s", expense.Deskripsi),
        Jumlah:     expense.Jumlah,
        ProjectID:  &expense.ProjectID, // Link to project
    }
    
    if err := h.financeService.CreateFinance(&financeEntry); err != nil {
        // Log error but don't fail the request
        fmt.Println("Failed to sync to finance:", err)
    }
    
    // ... rest of code ...
}
```

#### 3. Update Finance Entity
```go
// backend/internal/entity/finance.go

type Finance struct {
    ID         uint      `json:"id"`
    Type       string    `json:"type"` // Income or Expense
    Tanggal    string    `json:"tanggal"`
    Kategori   string    `json:"kategori"`
    Keterangan string    `json:"keterangan"`
    Jumlah     float64   `json:"jumlah"`
    ProjectID  *int      `json:"projectId,omitempty"` // NEW: Link to project
    CreatedAt  time.Time `json:"createdAt"`
    UpdatedAt  time.Time `json:"updatedAt"`
}
```

#### 4. Migration untuk ProjectID di Finance
```sql
ALTER TABLE finances 
ADD COLUMN project_id INT NULL,
ADD INDEX idx_project_id (project_id),
ADD FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
```

### Option 3: Unified View (Best Long-term)
Finance page menampilkan gabungan dari:
- Finance table (manual entries)
- Project incomes (auto-imported)
- Project expenses (auto-imported)

**Implementation:**
```go
// backend/internal/service/finance_service.go

func (s *financeService) GetAllFinanceWithProjects() ([]FinanceEntry, error) {
    var results []FinanceEntry
    
    // 1. Get manual finance entries
    var finances []entity.Finance
    s.repo.FindAll(&finances)
    
    for _, f := range finances {
        results = append(results, FinanceEntry{
            ID:         f.ID,
            Type:       f.Type,
            Tanggal:    f.Tanggal,
            Kategori:   f.Kategori,
            Keterangan: f.Keterangan,
            Jumlah:     f.Jumlah,
            Source:     "Manual",
        })
    }
    
    // 2. Get project incomes
    var incomes []entity.ProjectIncome
    s.incomeRepo.FindAll(&incomes)
    
    for _, i := range incomes {
        if i.Status == "Received" { // Only show received
            results = append(results, FinanceEntry{
                ID:         i.ID,
                Type:       "Income",
                Tanggal:    i.Tanggal,
                Kategori:   i.Kategori,
                Keterangan: fmt.Sprintf("Project: %s - %s", i.ProjectName, i.Deskripsi),
                Jumlah:     i.Jumlah,
                Source:     "Project",
                ProjectID:  i.ProjectID,
            })
        }
    }
    
    // 3. Get project expenses
    var expenses []entity.ProjectExpense
    s.expenseRepo.FindAll(&expenses)
    
    for _, e := range expenses {
        if e.Status == "Paid" { // Only show paid
            results = append(results, FinanceEntry{
                ID:         e.ID,
                Type:       "Expense",
                Tanggal:    e.Tanggal,
                Kategori:   e.Kategori,
                Keterangan: fmt.Sprintf("Project: %s - %s", e.ProjectName, e.Deskripsi),
                Jumlah:     e.Jumlah,
                Source:     "Project",
                ProjectID:  e.ProjectID,
            })
        }
    }
    
    // Sort by date
    sort.Slice(results, func(i, j int) bool {
        return results[i].Tanggal > results[j].Tanggal
    })
    
    return results, nil
}
```

## Recommended Implementation Plan

### Phase 1: Quick Fix (Current Sprint)
1. ✅ Keep systems separate for now
2. ✅ Add note in Finance page: "Note: Project-level income/expense tracked separately in Reports page"
3. ✅ Add filter in Finance page to show "Source: Manual" vs "Source: Project"

### Phase 2: Auto Sync (Next Sprint)
1. Add `project_id` column to `finances` table
2. Update handlers to auto-create finance entries
3. Add sync indicator in UI
4. Handle update/delete sync

### Phase 3: Unified View (Future)
1. Create unified API endpoint
2. Update Finance page to show combined data
3. Add source filter
4. Add project filter

## Quick Implementation for Phase 1

### Update Finance Page UI

Add info banner:

```tsx
// frontend/src/pages/Finance.tsx

<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div>
      <h4 className="font-semibold text-blue-900 mb-1">Informasi</h4>
      <p className="text-sm text-blue-800">
        Halaman ini untuk tracking keuangan umum. Untuk pemasukan & pengeluaran per project, 
        silakan gunakan <a href="/reports" className="underline font-semibold">halaman Reports</a>.
      </p>
    </div>
  </div>
</div>
```

### Add Project Link in Finance Table

```tsx
// If entry has projectId, show link
{finance.projectId && (
  <a 
    href={`/reports?project=${finance.projectId}`}
    className="text-blue-600 hover:underline text-xs"
  >
    View Project →
  </a>
)}
```

## Testing Checklist

### Project Level
- [ ] Create income di Reports page
- [ ] Create expense di Reports page
- [ ] Financial summary update correctly
- [ ] Income list shows data
- [ ] Expense list shows data
- [ ] Edit income/expense works
- [ ] Delete income/expense works

### Finance Level
- [ ] Manual entry masih bisa dibuat
- [ ] Filter berfungsi normal
- [ ] Export PDF works
- [ ] Total calculations correct

### Integration (Phase 2+)
- [ ] Project income sync to finance
- [ ] Project expense sync to finance
- [ ] Update sync works
- [ ] Delete sync works
- [ ] No duplicate entries
- [ ] Source indicator shows correctly

## Notes

- **Current State**: Systems are independent
- **Recommended**: Implement Phase 2 (Auto Sync) untuk production
- **Quick Fix**: Add info banner di Finance page
- **Long-term**: Unified view dengan source filter

## Support

Jika ada pertanyaan tentang integration, silakan refer ke:
- `PROJECT_INCOME_EXPENSE_FEATURE.md` - Feature documentation
- `backend/internal/http/project_income_handler.go` - Income handler
- `backend/internal/http/project_expense_handler.go` - Expense handler
- `frontend/src/pages/Finance.tsx` - Finance page
- `frontend/src/pages/Reports.tsx` - Reports page

