# Query Parameters Guide

Dokumen ini menjelaskan cara menggunakan query parameters untuk pagination, search, sort, dan filter pada API System Management IMB.

## Overview

API ini mendukung query parameters berikut:
- `page`: Halaman yang ingin ditampilkan (default: 1)
- `limit`: Jumlah item per halaman (default: 10, max: 100)
- `search`: Kata kunci pencarian
- `sort`: Field untuk sorting
- `order`: Urutan sorting (ASC/DESC, default: ASC)
- `filter`: Filter berdasarkan field tertentu

## Endpoints yang Mendukung Query Parameters

### 1. Users
```
GET /api/admin/users/paginated
```

### 2. Projects
```
GET /api/admin/projects/paginated
```

### 3. Members
```
GET /api/admin/members/paginated
```

### 4. Finances
```
GET /api/admin/finances/paginated
```

### 5. Inventory
```
GET /api/admin/inventory/paginated
```

## Query Parameters Detail

### Pagination
- `page`: Nomor halaman (integer, default: 1)
- `limit`: Jumlah item per halaman (integer, default: 10, max: 100)

**Contoh:**
```
GET /api/admin/users/paginated?page=2&limit=20
```

### Search
- `search`: Kata kunci pencarian (string)

**Fields yang dapat dicari per entity:**

**Users:**
- name
- email
- phone

**Projects:**
- name
- description
- location

**Members:**
- name
- email
- phone
- position

**Finances:**
- description
- category

**Inventory:**
- name
- description
- category

**Contoh:**
```
GET /api/admin/users/paginated?search=john
```

### Sort
- `sort`: Field untuk sorting (string)
- `order`: Urutan sorting (ASC/DESC, default: ASC)

**Fields yang dapat di-sort per entity:**

**Users:**
- id
- name
- email
- created_at
- updated_at

**Projects:**
- id
- name
- start_date
- end_date
- created_at
- updated_at

**Members:**
- id
- name
- position
- join_date
- created_at
- updated_at

**Finances:**
- id
- amount
- date
- created_at
- updated_at

**Inventory:**
- id
- name
- quantity
- price
- created_at
- updated_at

**Contoh:**
```
GET /api/admin/users/paginated?sort=name&order=DESC
```

### Filter
- `filter`: Filter dalam format "field1:value1,field2:value2" (string)

**Fields yang dapat di-filter per entity:**

**Users:**
- role
- status

**Projects:**
- status
- type

**Members:**
- status
- position

**Finances:**
- type
- category

**Inventory:**
- category
- status

**Contoh:**
```
GET /api/admin/users/paginated?filter=role:admin,status:active
```

## Kombinasi Query Parameters

Anda dapat mengkombinasikan semua query parameters dalam satu request:

```
GET /api/admin/users/paginated?page=2&limit=15&search=john&sort=name&order=ASC&filter=role:admin
```

## Response Format

Response akan memiliki format berikut:

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      // ... other fields
    }
  ],
  "pagination": {
    "page": 2,
    "limit": 15,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": true
  }
}
```

## Error Handling

Jika terjadi error, response akan memiliki format:

```json
{
  "error": "Error message",
  "status": 400
}
```

## Contoh Penggunaan Lengkap

### 1. Mendapatkan semua users dengan pagination
```
GET /api/admin/users/paginated
```

### 2. Mencari users dengan nama "john"
```
GET /api/admin/users/paginated?search=john
```

### 3. Sorting users berdasarkan nama secara descending
```
GET /api/admin/users/paginated?sort=name&order=DESC
```

### 4. Filter users berdasarkan role admin
```
GET /api/admin/users/paginated?filter=role:admin
```

### 5. Kombinasi lengkap
```
GET /api/admin/users/paginated?page=2&limit=20&search=john&sort=name&order=ASC&filter=role:admin
```

## Implementasi di Code

### 1. Handler
```go
func (h *UserHandler) GetAllUsersWithPagination(c echo.Context) error {
    params := response.ParseQueryParams(c)
    users, total, err := h.service.GetAllUsersWithPagination(params)
    if err != nil {
        return response.Error(c, http.StatusInternalServerError, err)
    }
    
    pagination := response.CalculatePagination(params.Page, params.Limit, total)
    return response.SuccessWithPagination(c, http.StatusOK, users, pagination)
}
```

### 2. Service
```go
func (s *userService) GetAllUsersWithPagination(params response.QueryParams) ([]entity.User, int, error) {
    return s.repo.FindAllWithPagination(params)
}
```

### 3. Repository
```go
func (r *userRepository) FindAllWithPagination(params response.QueryParams) ([]entity.User, int, error) {
    var users []entity.User
    
    queryBuilder := database.NewQueryBuilder(r.db)
    query := queryBuilder.BuildUserQuery(params)
    
    total, err := queryBuilder.Paginate(query, params, &users)
    if err != nil {
        return nil, 0, err
    }
    
    return users, total, nil
}
```

## Catatan Penting

1. **Case Sensitivity**: Search menggunakan ILIKE (case-insensitive)
2. **Default Values**: 
   - page = 1
   - limit = 10
   - order = ASC
3. **Maximum Limit**: 100 items per halaman
4. **Filter Format**: Menggunakan format "field:value,field2:value2"
5. **Sort Fields**: Hanya field yang diizinkan yang dapat digunakan untuk sorting
6. **Search Fields**: Hanya field yang diizinkan yang dapat dicari

## Testing

Anda dapat menggunakan Postman atau curl untuk testing:

```bash
# Contoh dengan curl
curl -X GET "http://localhost:8080/api/admin/users/paginated?page=1&limit=10&search=john&sort=name&order=ASC&filter=role:admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
``` 