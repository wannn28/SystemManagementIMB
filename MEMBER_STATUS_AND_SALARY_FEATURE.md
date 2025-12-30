# Fitur: Status Anggota Tim & Tracking Gaji

## Overview
Menambahkan kemampuan untuk mengaktifkan/menonaktifkan anggota tim dengan reason, serta tracking total gaji yang sudah dibayarkan untuk setiap anggota dan total keseluruhan tim.

## Backend Implementation

### 1. Database Migration
File: `backend/db/migrations/006_add_member_status_fields.up.sql`

```sql
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_members_is_active ON members(is_active);
```

### 2. Entity Updates
File: `backend/internal/entity/member.go`

**New Fields:**
- `IsActive` (bool) - Status aktif/nonaktif, default true
- `DeactivationReason` (string) - Alasan deaktivasi
- `DeactivatedAt` (*string) - Waktu deaktivasi

### 3. New Repository Methods
File: `backend/internal/repository/member_repository.go`

```go
// Deactivate member with reason
DeactivateMember(id string, reason string, deactivatedAt string) error

// Activate member (remove deactivation)
ActivateMember(id string) error

// Get total salary paid for a specific member
GetMemberTotalSalary(memberID string) (float64, error)

// Get total salary paid for all members
GetAllMembersTotalSalary() (float64, error)
```

**Salary Calculation Logic:**
- Hanya menghitung salary dengan status "Paid"
- Menggunakan SUM aggregate function
- Returns 0 jika tidak ada salary

### 4. New Service Methods
File: `backend/internal/service/member_service.go`

Same interface as repository, with automatic timestamp handling.

### 5. New Handler Methods
File: `backend/internal/http/member_handler.go`

```go
// POST /api/members/:id/deactivate
DeactivateMember(c echo.Context) error

// POST /api/members/:id/activate  
ActivateMember(c echo.Context) error

// GET /api/members/:id/total-salary
GetMemberTotalSalary(c echo.Context) error

// GET /api/members/total-salary
GetAllMembersTotalSalary(c echo.Context) error
```

**Activity Logging:**
- Deactivate: Log dengan reason
- Activate: Log aktivasi kembali

### 6. New API Endpoints
File: `backend/pkg/route/member_route.go`

```
POST   /api/members/:id/deactivate     - Nonaktifkan member dengan reason
POST   /api/members/:id/activate       - Aktifkan kembali member
GET    /api/members/:id/total-salary   - Total gaji member tertentu
GET    /api/members/total-salary       - Total gaji seluruh tim
```

## Frontend Implementation

### 1. TypeScript Types Update
File: `frontend/src/types/BasicTypes.ts`

```typescript
export interface Member {
  // ... existing fields ...
  isActive?: boolean;
  deactivationReason?: string;
  deactivatedAt?: string;
  totalSalary?: number;
}
```

### 2. API Client Updates
File: `frontend/src/api/team.ts`

**New Methods:**
```typescript
// Deactivate member
members.deactivate(memberId: string, reason: string)

// Activate member
members.activate(memberId: string)

// Get member total salary
members.getTotalSalary(memberId: string)

// Get all members total salary
members.getAllTotalSalary()
```

## API Endpoints Documentation

### 1. Deactivate Member
```http
POST /api/members/:id/deactivate
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "reason": "Mengundurkan diri"
}

Response:
{
  "status": 200,
  "data": {
    "message": "Member deactivated successfully"
  }
}
```

### 2. Activate Member
```http
POST /api/members/:id/activate
Authorization: Bearer <token>

Response:
{
  "status": 200,
  "data": {
    "message": "Member activated successfully"
  }
}
```

### 3. Get Member Total Salary
```http
GET /api/members/:id/total-salary
Authorization: Bearer <token>

Response:
{
  "status": 200,
  "data": {
    "member_id": "uuid-here",
    "total_salary": 15000000.00
  }
}
```

### 4. Get All Members Total Salary
```http
GET /api/members/total-salary
Authorization: Bearer <token>

Response:
{
  "status": 200,
  "data": {
    "total_salary": 450000000.00
  }
}
```

## Frontend UI Components (To Implement)

### 1. Deactivate Modal Component
```typescript
interface DeactivateMemberModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}
```

**Features:**
- Input field untuk alasan deaktivasi (required)
- Validation: reason tidak boleh kosong
- Confirmation button dengan loading state
- Cancel button
- Display member name yang akan dinonaktifkan

### 2. Member Card/Row Updates

**Status Badge:**
```tsx
{member.isActive ? (
  <span className="badge-success">Aktif</span>
) : (
  <span className="badge-danger">Nonaktif</span>
)}
```

**Action Buttons:**
```tsx
{member.isActive ? (
  <button onClick={() => openDeactivateModal(member)}>
    Nonaktifkan
  </button>
) : (
  <button onClick={() => handleActivate(member.id)}>
    Aktifkan Kembali
  </button>
)}
```

**Total Salary Display:**
```tsx
<div className="salary-info">
  <label>Total Gaji Dibayar:</label>
  <span className="amount">
    {formatCurrency(member.totalSalary || 0)}
  </span>
</div>
```

### 3. Team Summary Card

**Display Total Team Salary:**
```tsx
<div className="team-summary-card">
  <h3>Total Gaji Tim</h3>
  <div className="total-amount">
    {formatCurrency(totalTeamSalary)}
  </div>
  <p className="description">
    Total gaji yang sudah dibayarkan ke semua anggota tim
  </p>
</div>
```

## Usage Flow

### Deactivate Member Flow:
1. User click "Nonaktifkan" button pada member card
2. Modal muncul dengan form reason
3. User input reason (e.g., "Resign", "PHK", "Pindah divisi")
4. User click "Nonaktifkan"
5. API call ke `/api/members/:id/deactivate`
6. Success: Modal close, member status update ke "Nonaktif"
7. Activity logged: "Member {name} dinonaktifkan. Alasan: {reason}"

### Activate Member Flow:
1. User click "Aktifkan Kembali" button
2. Confirmation dialog (optional)
3. API call ke `/api/members/:id/activate`
4. Success: Member status update ke "Aktif"
5. Activity logged: "Member {name} diaktifkan kembali"

### View Salary Flow:
1. Page load: Fetch total team salary
2. For each member: Display individual total salary
3. Auto-calculate from "Paid" salaries only

## Benefits

### For Management:
1. **Track Member Status** - Tahu siapa yang aktif/nonaktif
2. **Salary History** - Total gaji per member dan tim
3. **Audit Trail** - Reason untuk setiap deaktivasi
4. **Better Planning** - Data untuk budgeting

### For HR:
1. **Documentation** - Record lengkap alasan keluar/nonaktif
2. **Quick Reactivation** - Mudah aktifkan kembali jika needed
3. **Salary Transparency** - Clear record pembayaran

### For System:
1. **Data Integrity** - Soft delete dengan reason
2. **Historical Data** - Keep data untuk reporting
3. **Activity Logging** - Automatic audit trail

## Technical Considerations

### Performance:
- Index pada `is_active` column untuk faster queries
- Aggregate SUM efficient dengan database index
- Cache total salary results if needed

### Security:
- All endpoints protected dengan AdminAuth middleware
- Reason required untuk deactivation (prevent accidental)
- Activity logging untuk audit trail

### Data Integrity:
- Soft delete (tidak delete data member)
- Keep salary history intact
- Timestamp untuk deactivation tracking

## Future Enhancements

Possible improvements:
- [ ] Bulk activate/deactivate
- [ ] Export deactivated members report
- [ ] Email notification saat deactivate
- [ ] Automatic deactivation after X months inactive
- [ ] Reactivation approval workflow
- [ ] Salary breakdown by month/year
- [ ] Compare salary trends over time

## Testing Checklist

### Backend:
- [ ] Deactivate member dengan valid reason
- [ ] Tidak bisa deactivate tanpa reason
- [ ] Activate member yang sudah nonaktif
- [ ] Get total salary untuk member tertentu
- [ ] Get total salary untuk semua member
- [ ] Activity logs created correctly

### Frontend:
- [ ] Modal muncul saat click "Nonaktifkan"
- [ ] Validation reason tidak boleh kosong
- [ ] Status badge update setelah deactivate/activate
- [ ] Total salary displayed correctly
- [ ] Loading states work properly
- [ ] Error handling works

## Migration Notes

### Database Migration:
```bash
# Run migration
mysql -u user -p database < backend/db/migrations/006_add_member_status_fields.up.sql

# Rollback if needed
mysql -u user -p database < backend/db/migrations/006_add_member_status_fields.down.sql
```

### Default Values:
- Existing members: `is_active` = TRUE (default)
- New members: `is_active` = TRUE (default)
- `deactivation_reason` = NULL for active members
- `deactivated_at` = NULL for active members

## Conclusion

Feature ini memberikan kontrol penuh atas status anggota tim dengan tracking yang lengkap, termasuk alasan deaktivasi dan history pembayaran gaji. Sangat berguna untuk manajemen HR dan budgeting.

## Files Modified/Created

### Backend:
- ✅ `backend/db/migrations/006_add_member_status_fields.up.sql`
- ✅ `backend/db/migrations/006_add_member_status_fields.down.sql`
- ✅ `backend/internal/entity/member.go`
- ✅ `backend/internal/repository/member_repository.go`
- ✅ `backend/internal/service/member_service.go`
- ✅ `backend/internal/http/member_handler.go`
- ✅ `backend/pkg/route/member_route.go`

### Frontend:
- ✅ `frontend/src/types/BasicTypes.ts`
- ✅ `frontend/src/api/team.ts`
- ⏳ `frontend/src/component/DeactivateMemberModal.tsx` (To Create)
- ⏳ `frontend/src/pages/Team.tsx` (To Update)

