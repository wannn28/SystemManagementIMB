# Testing Fixed Implementation

Dokumen ini berisi testing untuk implementasi query parameters yang sudah diperbaiki.

## 🔧 **Perbaikan yang Dilakukan**

### 1. QueryBuilder Fix
- Menambahkan `Model()` untuk mengatur table dengan benar
- Memperbaiki field names sesuai dengan entity yang ada
- Menambahkan import untuk entity

### 2. Field Names yang Diperbaiki

#### Users
- **Search Fields**: name, email
- **Sort Fields**: id, name, email, created_at, updated_at
- **Filter Fields**: role

#### Projects
- **Search Fields**: name, description, status
- **Sort Fields**: id, name, start_date, end_date, created_at, updated_at
- **Filter Fields**: status

#### Members
- **Search Fields**: full_name, role, phone_number
- **Sort Fields**: id, full_name, role, join_date, created_at, updated_at
- **Filter Fields**: role

#### Finances
- **Search Fields**: keterangan, category
- **Sort Fields**: id, jumlah, tanggal, created_at, updated_at
- **Filter Fields**: type, category, status

#### Salaries
- **Search Fields**: member_id, month
- **Sort Fields**: id, member_id, salary, month, created_at, updated_at
- **Filter Fields**: member_id, status, month

#### Kasbons
- **Search Fields**: keterangan, salary_id
- **Sort Fields**: id, salary_id, jumlah, tanggal, created_at, updated_at
- **Filter Fields**: salary_id

#### Activities
- **Search Fields**: title, description, type
- **Sort Fields**: id, type, timestamp, created_at, updated_at
- **Filter Fields**: type

## 🧪 **Testing dengan Postman**

### 1. Users
```bash
# Basic pagination
GET {{base_url}}/api/admin/users/paginated?page=1&limit=10

# Search users
GET {{base_url}}/api/admin/users/paginated?search=john

# Sort users by name
GET {{base_url}}/api/admin/users/paginated?sort=name&order=ASC

# Filter users by role
GET {{base_url}}/api/admin/users/paginated?filter=role:admin

# Complete combination
GET {{base_url}}/api/admin/users/paginated?page=1&limit=10&search=john&sort=name&order=ASC&filter=role:admin
```

### 2. Projects
```bash
# Basic pagination
GET {{base_url}}/api/projects/paginated?page=1&limit=10

# Search projects
GET {{base_url}}/api/projects/paginated?search=construction

# Sort by name
GET {{base_url}}/api/projects/paginated?sort=name&order=ASC

# Filter by status
GET {{base_url}}/api/projects/paginated?filter=status:active

# Complete combination
GET {{base_url}}/api/projects/paginated?page=1&limit=10&search=construction&sort=name&order=ASC&filter=status:active
```

### 3. Members
```bash
# Basic pagination
GET {{base_url}}/api/members/paginated?page=1&limit=10

# Search members
GET {{base_url}}/api/members/paginated?search=engineer

# Sort by full name
GET {{base_url}}/api/members/paginated?sort=full_name&order=ASC

# Filter by role
GET {{base_url}}/api/members/paginated?filter=role:manager

# Complete combination
GET {{base_url}}/api/members/paginated?page=1&limit=10&search=engineer&sort=full_name&order=ASC&filter=role:manager
```

### 4. Finances
```bash
# Basic pagination
GET {{base_url}}/api/finance/paginated?page=1&limit=10

# Search finances
GET {{base_url}}/api/finance/paginated?search=salary

# Sort by amount
GET {{base_url}}/api/finance/paginated?sort=jumlah&order=DESC

# Filter by type
GET {{base_url}}/api/finance/paginated?filter=type:income

# Complete combination
GET {{base_url}}/api/finance/paginated?page=1&limit=10&search=salary&sort=jumlah&order=DESC&filter=type:income
```

### 5. Salaries
```bash
# Basic pagination
GET {{base_url}}/api/members/salaries/paginated?page=1&limit=10

# Search salaries
GET {{base_url}}/api/members/salaries/paginated?search=2024-01

# Sort by salary amount
GET {{base_url}}/api/members/salaries/paginated?sort=salary&order=DESC

# Filter by month
GET {{base_url}}/api/members/salaries/paginated?filter=month:2024-01

# Complete combination
GET {{base_url}}/api/members/salaries/paginated?page=1&limit=10&search=2024-01&sort=salary&order=DESC&filter=month:2024-01
```

### 6. Kasbons
```bash
# Basic pagination
GET {{base_url}}/api/salaries/kasbons/paginated?page=1&limit=10

# Search kasbons
GET {{base_url}}/api/salaries/kasbons/paginated?search=loan

# Sort by amount
GET {{base_url}}/api/salaries/kasbons/paginated?sort=jumlah&order=DESC

# Filter by salary ID
GET {{base_url}}/api/salaries/kasbons/paginated?filter=salary_id:1

# Complete combination
GET {{base_url}}/api/salaries/kasbons/paginated?page=1&limit=10&search=loan&sort=jumlah&order=DESC&filter=salary_id:1
```

### 7. Activities
```bash
# Basic pagination
GET {{base_url}}/api/activities/paginated?page=1&limit=10

# Search activities
GET {{base_url}}/api/activities/paginated?search=login

# Sort by timestamp
GET {{base_url}}/api/activities/paginated?sort=timestamp&order=DESC

# Filter by type
GET {{base_url}}/api/activities/paginated?filter=type:income

# Complete combination
GET {{base_url}}/api/activities/paginated?page=1&limit=10&search=login&sort=timestamp&order=DESC&filter=type:income
```

## 🧪 **Testing dengan cURL**

### 1. Users
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/admin/users/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/admin/users/paginated?page=1&limit=5&search=john&sort=name&order=ASC&filter=role:admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Members
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/members/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/members/paginated?page=1&limit=10&search=engineer&sort=full_name&order=ASC&filter=role:manager" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Finances
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/finance/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/finance/paginated?page=1&limit=10&search=salary&sort=jumlah&order=DESC&filter=type:income" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 **Expected Response Format**

### Success Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### Error Response (Fixed)
```json
{
  "error": "Error message",
  "status": 400
}
```

## 🔍 **Troubleshooting**

### 1. Jika masih ada error "Table not set"
- Pastikan entity struct sudah benar
- Pastikan field names sesuai dengan database
- Pastikan import entity sudah benar

### 2. Jika search tidak berfungsi
- Pastikan field names dalam searchFields sesuai dengan database
- Pastikan field tersebut ada di entity

### 3. Jika sort tidak berfungsi
- Pastikan field names dalam allowedSortFields sesuai dengan database
- Pastikan field tersebut ada di entity

### 4. Jika filter tidak berfungsi
- Pastikan field names dalam allowedFilterFields sesuai dengan database
- Pastikan field tersebut ada di entity

## ✅ **Verification Steps**

1. **Test Basic Pagination**
   - Response status: 200
   - Response contains "data" array
   - Response contains "pagination" object

2. **Test Search**
   - Search parameter works
   - Results filtered correctly

3. **Test Sort**
   - Sort parameter works
   - Results ordered correctly

4. **Test Filter**
   - Filter parameter works
   - Results filtered correctly

5. **Test Combination**
   - All parameters work together
   - No conflicts between parameters

## 🚀 **Next Steps**

1. Test semua endpoint dengan data real
2. Monitor performance
3. Add database indexes if needed
4. Implement caching if required
5. Add more advanced features (date ranges, etc.) 