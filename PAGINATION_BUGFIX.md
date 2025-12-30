# Bug Fix: Pagination Activities Not Working

## Masalah
- Modal "Semua Aktivitas" menampilkan "Halaman 1 dari" tanpa angka totalPages
- Button "Selanjutnya" tidak berfungsi meskipun ada 4338 aktivitas
- Pagination tidak bekerja dengan benar

## Penyebab
Backend mengembalikan field dengan format **snake_case** (`total_pages`, `has_next`, `has_prev`), sedangkan frontend mengharapkan format **camelCase** (`totalPages`, `hasNext`, `hasPrev`).

### Backend Response (Correct):
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4338,
    "total_pages": 434,
    "has_next": true,
    "has_prev": false
  }
}
```

### Frontend Expected (Before Fix):
```typescript
{
  page: 1,
  limit: 10,
  total: 4338,
  totalPages: 434,  // ❌ Tidak ada mapping dari total_pages
  hasNext: true,    // ❌ Tidak ada mapping dari has_next
  hasPrev: false    // ❌ Tidak ada mapping dari has_prev
}
```

## Solusi

### 1. Update Interface di `frontend/src/api/activities.ts`

Menambahkan dua interface:
- `PaginationResponse` - untuk response dari backend (snake_case)
- `FrontendPagination` - untuk digunakan di frontend (camelCase)

```typescript
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;  // Backend returns snake_case
  has_next: boolean;     // Backend returns snake_case
  has_prev: boolean;     // Backend returns snake_case
}

export interface FrontendPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### 2. Mapping Response di API Call

```typescript
getAllActivitiesWithPagination: async (params?: PaginationParams): Promise<ActivitiesResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.order) queryParams.append('order', params.order);

  const response: any = await axios.get(`${API_URL}/paginated?${queryParams.toString()}`);
  
  // Map snake_case from backend to camelCase for frontend ✅
  const backendPagination: PaginationResponse = response.data.pagination || {...};

  return {
    data: response.data.data || [],
    pagination: {
      page: backendPagination.page,
      limit: backendPagination.limit,
      total: backendPagination.total,
      totalPages: backendPagination.total_pages,      // ✅ Mapped
      hasNext: backendPagination.has_next,            // ✅ Mapped
      hasPrev: backendPagination.has_prev             // ✅ Mapped
    }
  };
},
```

### 3. Update Component dengan Type yang Benar

```typescript
import { FrontendPagination } from '../api/activities';

const [pagination, setPagination] = useState<FrontendPagination>({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
});
```

## Improvement Tambahan

### Enhanced Pagination UI

Menambahkan kontrol pagination yang lebih lengkap:

1. **Info Pagination yang Detail:**
   ```
   Halaman 1 dari 434 • Menampilkan 1-10 dari 4338 aktivitas
   ```

2. **4 Button Controls:**
   - **Pertama** - Jump ke halaman pertama
   - **Sebelumnya** - Ke halaman sebelumnya
   - **Selanjutnya** - Ke halaman berikutnya
   - **Terakhir** - Jump ke halaman terakhir

3. **Console Logging untuk Debugging:**
   ```typescript
   console.log('Activities response:', response);
   console.log('Pagination:', response.pagination);
   ```

## File yang Diubah

1. ✅ `frontend/src/api/activities.ts`
   - Menambahkan interface `PaginationResponse` dan `FrontendPagination`
   - Mapping snake_case ke camelCase di `getAllActivitiesWithPagination`

2. ✅ `frontend/src/component/ActivitiesModal.tsx`
   - Update import untuk menggunakan `FrontendPagination`
   - Update state type
   - Improved pagination UI
   - Added debugging console logs

## Testing

### Before Fix:
```
❌ Halaman 1 dari         (totalPages = undefined/0)
❌ Button "Selanjutnya" disabled (hasNext = undefined/false)
❌ Tidak bisa navigasi ke halaman lain
```

### After Fix:
```
✅ Halaman 1 dari 434
✅ Menampilkan 1-10 dari 4338 aktivitas
✅ Button "Selanjutnya" enabled
✅ Bisa navigasi ke halaman lain
✅ Button "Pertama" dan "Terakhir" berfungsi
```

## Cara Test

1. **Build & Run Backend:**
   ```bash
   cd backend
   go run cmd/main.go
   ```

2. **Build & Run Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test di Browser:**
   - Buka dashboard
   - Klik "Lihat Semua" pada section Aktivitas Terkini
   - Verify info pagination: "Halaman 1 dari X"
   - Test button "Selanjutnya" - harus enabled jika ada halaman berikutnya
   - Test navigasi ke halaman 2, 3, dst
   - Test button "Terakhir" - jump ke halaman terakhir
   - Test button "Pertama" - jump ke halaman pertama

4. **Check Console:**
   - Buka Developer Tools (F12)
   - Lihat Console tab
   - Verify ada log "Activities response:" dan "Pagination:"
   - Verify pagination data memiliki totalPages, hasNext, hasPrev yang benar

## Conclusion

Bug disebabkan oleh perbedaan naming convention antara backend (snake_case) dan frontend (camelCase). Fix dilakukan dengan membuat proper mapping di layer API, sehingga komponen frontend tetap menggunakan camelCase yang konsisten dengan JavaScript/TypeScript convention.

## Lessons Learned

1. **Always map API responses** - Jangan assume frontend dan backend menggunakan naming convention yang sama
2. **Use proper TypeScript types** - Type checking akan membantu catch issue seperti ini lebih awal
3. **Add debugging logs** - Console logs sangat membantu untuk debugging
4. **Test with real data** - Test dengan data yang banyak (4338 items) membantu menemukan bug pagination

## Future Improvements

- [ ] Consider adding auto-mapping library (e.g., `camelcase-keys`)
- [ ] Add unit tests for pagination mapping
- [ ] Add page number input field untuk jump ke halaman spesifik
- [ ] Add items per page selector (10, 25, 50, 100)

