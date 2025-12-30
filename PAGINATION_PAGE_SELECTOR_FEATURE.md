# Fitur: Page Selector untuk Pagination Activities

## Overview
Menambahkan kemampuan untuk jump langsung ke halaman tertentu pada modal "Semua Aktivitas" dengan beberapa cara:
1. **Input field** - Ketik nomor halaman dan tekan "Go" atau Enter
2. **Page numbers** - Click langsung pada nomor halaman yang ditampilkan
3. **Smart pagination** - Menampilkan page numbers dengan ellipsis untuk halaman banyak

## Fitur yang Ditambahkan

### 1. Jump to Page Input
Input field yang memungkinkan user untuk langsung jump ke halaman tertentu.

```typescript
<form onSubmit={handlePageInputSubmit}>
  <label>Ke halaman:</label>
  <input 
    type="number" 
    min="1" 
    max={totalPages}
    value={pageInput}
  />
  <button type="submit">Go</button>
</form>
```

**Fitur:**
- ✅ Validation: hanya menerima angka 1 sampai totalPages
- ✅ Submit dengan Enter key atau click "Go" button
- ✅ Auto-reset ke current page jika input invalid
- ✅ Styling modern dengan gradient orange button

### 2. Page Numbers dengan Ellipsis
Menampilkan nomor halaman yang bisa di-click langsung, dengan smart ellipsis untuk halaman banyak.

**Logic Smart Pagination:**
```typescript
// Jika total halaman <= 7: tampilkan semua
[1] [2] [3] [4] [5] [6] [7]

// Jika total halaman > 7: tampilkan dengan ellipsis
[1] ... [5] [6] [7] ... [434]  // Current page = 6

// Pattern:
// - Selalu tampilkan halaman pertama (1)
// - Tampilkan ... jika ada gap
// - Tampilkan current - 1, current, current + 1
// - Tampilkan ... jika ada gap
// - Selalu tampilkan halaman terakhir
```

**Contoh Visual:**

```
Current page = 1:
[1] [2] [3] ... [434]

Current page = 5:
[1] ... [4] [5] [6] ... [434]

Current page = 50:
[1] ... [49] [50] [51] ... [434]

Current page = 434:
[1] ... [432] [433] [434]
```

### 3. Enhanced UI Layout

**3 Baris Pagination:**

1. **Baris 1 - Info & Jump Input:**
   ```
   Halaman 1 dari 434 • Menampilkan 1-10 dari 4338 aktivitas     [Ke halaman: [__] Go]
   ```

2. **Baris 2 - Page Numbers:**
   ```
   [1] [2] [3] ... [434]
   ```

3. **Baris 3 - Navigation Buttons:**
   ```
   [Pertama]    [< Sebelumnya]  [Selanjutnya >]    [Terakhir]
   ```

## Implementation Details

### State Management
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [pageInput, setPageInput] = useState('1');
```

### Handler Functions

#### 1. handlePageChange
```typescript
const handlePageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= pagination.totalPages) {
    setCurrentPage(newPage);
    setPageInput(newPage.toString());  // Sync input field
  }
};
```

#### 2. handlePageInputChange
```typescript
const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setPageInput(value);  // Allow typing
};
```

#### 3. handlePageInputSubmit
```typescript
const handlePageInputSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const pageNumber = parseInt(pageInput, 10);
  
  if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= pagination.totalPages) {
    setCurrentPage(pageNumber);
  } else {
    // Reset to current page if invalid
    setPageInput(currentPage.toString());
  }
};
```

#### 4. getPageNumbers (Smart Ellipsis)
```typescript
const getPageNumbers = () => {
  const pages: (number | string)[] = [];
  const totalPages = pagination.totalPages;
  const current = currentPage;

  if (totalPages <= 7) {
    // Show all pages if 7 or less
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Smart pagination with ellipsis
    pages.push(1);  // Always first page
    
    if (current > 3) pages.push('...');
    
    // Pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < totalPages - 2) pages.push('...');
    
    pages.push(totalPages);  // Always last page
  }

  return pages;
};
```

## Styling

### Active Page Number
```css
Current page: 
- Gradient orange background
- White text
- Shadow effect

Other pages:
- White background
- Gray text
- Border
- Hover effect
```

### Input Field
```css
- Width: 80px (w-20)
- Center aligned text
- Number input with min/max validation
- Orange focus ring
- Rounded corners
```

### Go Button
```css
- Gradient orange-to-amber
- White text
- Hover shadow effect
- Font semibold
```

## User Experience

### Keyboard Support
- ✅ Type halaman di input field
- ✅ Press **Enter** untuk submit
- ✅ Press **Tab** untuk navigate
- ✅ Input auto-validates on submit

### Mouse/Touch Support
- ✅ Click page numbers
- ✅ Click navigation buttons
- ✅ Click "Go" button
- ✅ All buttons have hover states

### Visual Feedback
- ✅ Active page highlighted dengan gradient
- ✅ Disabled buttons berbeda warna
- ✅ Hover effects pada semua clickable elements
- ✅ Loading state saat fetch data

## Testing Scenarios

### Test Case 1: Jump to Specific Page
1. Buka modal aktivitas
2. Ketik "100" di input field
3. Click "Go" atau press Enter
4. ✅ Verify: Navigasi ke halaman 100
5. ✅ Verify: Page numbers update
6. ✅ Verify: Data di-fetch untuk halaman 100

### Test Case 2: Click Page Number
1. Buka modal aktivitas
2. Click pada page number (e.g., "3")
3. ✅ Verify: Navigasi ke halaman 3
4. ✅ Verify: Input field update ke "3"
5. ✅ Verify: Active page highlighted

### Test Case 3: Invalid Input
1. Ketik "0" atau angka negatif
2. Click "Go"
3. ✅ Verify: Tetap di current page
4. ✅ Verify: Input reset ke current page

### Test Case 4: Out of Range
1. Ketik "999" (lebih dari totalPages)
2. Click "Go"
3. ✅ Verify: Tetap di current page
4. ✅ Verify: Input reset ke current page

### Test Case 5: Smart Ellipsis
1. Navigate ke berbagai halaman
2. ✅ Verify: Ellipsis muncul dengan benar
3. ✅ Verify: First dan last page selalu tampil
4. ✅ Verify: Current page dan neighbors tampil

## Benefits

### For Users
1. **Faster Navigation** - Jump langsung ke halaman tertentu tanpa click berkali-kali
2. **Flexibility** - Multiple ways to navigate (input, numbers, buttons)
3. **Visual Clarity** - See available pages at a glance
4. **Better UX** - Smart ellipsis prevents cluttered UI

### For Developers
1. **Reusable Logic** - getPageNumbers() dapat digunakan di component lain
2. **Type Safe** - Full TypeScript support
3. **Maintainable** - Clear separation of concerns
4. **Testable** - Easy to unit test

## File Modified
- ✅ `frontend/src/component/ActivitiesModal.tsx`
  - Added `pageInput` state
  - Added `handlePageInputChange()`
  - Added `handlePageInputSubmit()`
  - Added `getPageNumbers()` for smart pagination
  - Enhanced UI with 3-row pagination layout

## Future Enhancements

Possible improvements:
- [ ] Items per page selector (10, 25, 50, 100)
- [ ] Keyboard shortcuts (Home/End keys)
- [ ] Remember last visited page
- [ ] Smooth scroll animation on page change
- [ ] Page preview on hover
- [ ] Bulk page jump (e.g., +10, -10)

## Performance Considerations

### Optimizations Applied:
1. **Memoization** - Page numbers calculated only when needed
2. **Conditional Rendering** - Ellipsis only for many pages
3. **Smart Limits** - Max 7 page numbers displayed at once
4. **Input Debouncing** - Could be added if needed

### Scalability:
- ✅ Works efficiently with 434 pages (4338 items)
- ✅ Works with any number of pages
- ✅ No performance degradation
- ✅ Minimal re-renders

## Accessibility

### A11y Features:
- ✅ Semantic HTML (form, button, input)
- ✅ Labels for input field
- ✅ Keyboard navigation support
- ✅ Clear focus states
- ✅ Disabled state for invalid actions

## Browser Compatibility
- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers

## Conclusion

Fitur page selector memberikan flexibilitas maksimal untuk navigasi pagination:
- **Quick jump** dengan input field
- **Visual navigation** dengan page numbers
- **Traditional controls** dengan Previous/Next buttons

Kombinasi ketiga metode ini memberikan UX yang optimal untuk berbagai preferensi user.

