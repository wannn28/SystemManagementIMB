# Testing Query Parameters

Dokumen ini berisi contoh testing untuk query parameters pagination, search, sort, dan filter.

## Testing dengan Postman

### 1. Testing Users Pagination

#### Basic Pagination
```
GET http://localhost:8080/api/admin/users/paginated
```

#### Pagination dengan Parameter
```
GET http://localhost:8080/api/admin/users/paginated?page=1&limit=5
```

#### Search Users
```
GET http://localhost:8080/api/admin/users/paginated?search=john
```

#### Sort Users
```
GET http://localhost:8080/api/admin/users/paginated?sort=name&order=ASC
```

#### Filter Users
```
GET http://localhost:8080/api/admin/users/paginated?filter=role:admin
```

#### Kombinasi Lengkap
```
GET http://localhost:8080/api/admin/users/paginated?page=1&limit=10&search=john&sort=name&order=DESC&filter=role:admin
```

### 2. Testing Projects Pagination

#### Basic Pagination
```
GET http://localhost:8080/api/projects/paginated
```

#### Search Projects
```
GET http://localhost:8080/api/projects/paginated?search=construction
```

#### Sort Projects
```
GET http://localhost:8080/api/projects/paginated?sort=start_date&order=DESC
```

#### Filter Projects
```
GET http://localhost:8080/api/projects/paginated?filter=status:active
```

### 3. Testing Members Pagination

#### Basic Pagination
```
GET http://localhost:8080/api/members/paginated
```

#### Search Members
```
GET http://localhost:8080/api/members/paginated?search=engineer
```

#### Sort Members
```
GET http://localhost:8080/api/members/paginated?sort=join_date&order=DESC
```

#### Filter Members
```
GET http://localhost:8080/api/members/paginated?filter=position:manager
```

### 4. Testing Finances Pagination

#### Basic Pagination
```
GET http://localhost:8080/api/finances/paginated
```

#### Search Finances
```
GET http://localhost:8080/api/finances/paginated?search=salary
```

#### Sort Finances
```
GET http://localhost:8080/api/finances/paginated?sort=amount&order=DESC
```

#### Filter Finances
```
GET http://localhost:8080/api/finances/paginated?filter=type:income
```

### 5. Testing Inventory Pagination

#### Basic Pagination
```
GET http://localhost:8080/api/inventory/paginated
```

#### Search Inventory
```
GET http://localhost:8080/api/inventory/paginated?search=cement
```

#### Sort Inventory
```
GET http://localhost:8080/api/inventory/paginated?sort=quantity&order=ASC
```

#### Filter Inventory
```
GET http://localhost:8080/api/inventory/paginated?filter=category:materials
```

## Testing dengan cURL

### 1. Users
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/admin/users/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/admin/users/paginated?page=1&limit=5&search=john&sort=name&order=ASC&filter=role:admin" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Projects
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/projects/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/projects/paginated?page=1&limit=10&search=construction&sort=start_date&order=DESC&filter=status:active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Expected Response Format

### Success Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin",
      "status": "active",
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

### Error Response
```json
{
  "error": "Invalid query parameters",
  "status": 400
}
```

## Testing Scenarios

### 1. Valid Parameters
- ✅ page=1, limit=10
- ✅ search=john
- ✅ sort=name, order=ASC
- ✅ filter=role:admin
- ✅ Kombinasi semua parameter

### 2. Invalid Parameters
- ❌ page=0 (should default to 1)
- ❌ limit=200 (should default to 100)
- ❌ order=INVALID (should default to ASC)
- ❌ sort=invalid_field (should be ignored)
- ❌ filter=invalid:format (should be ignored)

### 3. Edge Cases
- ✅ Empty search string
- ✅ Empty filter string
- ✅ No parameters provided
- ✅ Very large page numbers
- ✅ Special characters in search

## Performance Testing

### 1. Large Dataset
```bash
# Test dengan dataset besar
curl -X GET "http://localhost:8080/api/admin/users/paginated?page=1&limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Complex Search
```bash
# Test dengan search yang kompleks
curl -X GET "http://localhost:8080/api/admin/users/paginated?search=john%20doe&sort=name&order=ASC&filter=role:admin,status:active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Testing

### 1. SQL Injection Prevention
```bash
# Test dengan karakter khusus
curl -X GET "http://localhost:8080/api/admin/users/paginated?search=';DROP TABLE users;--" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Authorization
```bash
# Test tanpa token
curl -X GET "http://localhost:8080/api/admin/users/paginated"

# Test dengan token invalid
curl -X GET "http://localhost:8080/api/admin/users/paginated" \
  -H "Authorization: Bearer INVALID_TOKEN"
```

## Monitoring dan Logging

### 1. Response Time
Monitor response time untuk berbagai query:
- Simple pagination: < 100ms
- Search with pagination: < 200ms
- Complex filter with pagination: < 300ms

### 2. Error Logging
Pastikan error log tercatat dengan baik:
- Invalid parameters
- Database errors
- Authorization errors

### 3. Query Performance
Monitor query performance di database:
- Index usage
- Query execution time
- Memory usage

## Tips Testing

1. **Gunakan Postman Collection**: Import collection yang sudah disediakan
2. **Test Environment**: Gunakan environment variables untuk URL dan token
3. **Data Preparation**: Pastikan ada data yang cukup untuk testing pagination
4. **Edge Cases**: Test dengan berbagai kombinasi parameter
5. **Performance**: Monitor response time dan resource usage
6. **Security**: Test dengan input yang berpotensi berbahaya 