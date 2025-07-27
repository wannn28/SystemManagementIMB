# Complete API Endpoints dengan Pagination

Dokumen ini berisi semua endpoint API yang mendukung query parameters untuk pagination, search, sort, dan filter.

## 🎯 **Endpoints yang Tersedia**

### 1. Users
```
GET /api/admin/users/paginated
```

### 2. Projects
```
GET /api/projects/paginated
```

### 3. Members
```
GET /api/members/paginated
```

### 4. Finances
```
GET /api/finance/paginated
```

### 5. Salaries
```
GET /api/members/salaries/paginated
```

### 6. Kasbons
```
GET /api/salaries/kasbons/paginated
```

### 7. Activities
```
GET /api/activities/paginated
```

### 8. Inventory
```
GET /api/inventory/paginated (pending implementation)
```

## 📋 **Query Parameters untuk Setiap Entity**

### Users
- **Search Fields**: name, email, phone
- **Sort Fields**: id, name, email, created_at, updated_at
- **Filter Fields**: role, status

### Projects
- **Search Fields**: name, description, location
- **Sort Fields**: id, name, start_date, end_date, created_at, updated_at
- **Filter Fields**: status, type

### Members
- **Search Fields**: name, email, phone, position
- **Sort Fields**: id, name, position, join_date, created_at, updated_at
- **Filter Fields**: status, position

### Finances
- **Search Fields**: description, category
- **Sort Fields**: id, amount, date, created_at, updated_at
- **Filter Fields**: type, category

### Salaries
- **Search Fields**: member_name, description
- **Sort Fields**: id, member_id, amount, month, year, created_at, updated_at
- **Filter Fields**: member_id, status, month, year

### Kasbons
- **Search Fields**: description, member_name
- **Sort Fields**: id, salary_id, amount, date, created_at, updated_at
- **Filter Fields**: salary_id, status, type

### Activities
- **Search Fields**: title, description, type
- **Sort Fields**: id, type, timestamp, created_at, updated_at
- **Filter Fields**: type, user_id

### Inventory
- **Search Fields**: name, description, category
- **Sort Fields**: id, name, quantity, price, created_at, updated_at
- **Filter Fields**: category, status

## 🔍 **Contoh Penggunaan Lengkap**

### 1. Users
```bash
# Basic pagination
GET /api/admin/users/paginated?page=1&limit=10

# Search users
GET /api/admin/users/paginated?search=john

# Sort users by name descending
GET /api/admin/users/paginated?sort=name&order=DESC

# Filter users by role
GET /api/admin/users/paginated?filter=role:admin

# Complete combination
GET /api/admin/users/paginated?page=1&limit=10&search=john&sort=name&order=ASC&filter=role:admin
```

### 2. Projects
```bash
# Basic pagination
GET /api/projects/paginated?page=1&limit=10

# Search projects
GET /api/projects/paginated?search=construction

# Sort by start date
GET /api/projects/paginated?sort=start_date&order=DESC

# Filter by status
GET /api/projects/paginated?filter=status:active

# Complete combination
GET /api/projects/paginated?page=1&limit=10&search=construction&sort=start_date&order=DESC&filter=status:active
```

### 3. Members
```bash
# Basic pagination
GET /api/members/paginated?page=1&limit=10

# Search members
GET /api/members/paginated?search=engineer

# Sort by join date
GET /api/members/paginated?sort=join_date&order=DESC

# Filter by position
GET /api/members/paginated?filter=position:manager

# Complete combination
GET /api/members/paginated?page=1&limit=10&search=engineer&sort=join_date&order=DESC&filter=position:manager
```

### 4. Finances
```bash
# Basic pagination
GET /api/finance/paginated?page=1&limit=10

# Search finances
GET /api/finance/paginated?search=salary

# Sort by amount
GET /api/finance/paginated?sort=amount&order=DESC

# Filter by type
GET /api/finance/paginated?filter=type:income

# Complete combination
GET /api/finance/paginated?page=1&limit=10&search=salary&sort=amount&order=DESC&filter=type:income
```

### 5. Salaries
```bash
# Basic pagination
GET /api/members/salaries/paginated?page=1&limit=10

# Search salaries
GET /api/members/salaries/paginated?search=john

# Sort by amount
GET /api/members/salaries/paginated?sort=amount&order=DESC

# Filter by month
GET /api/members/salaries/paginated?filter=month:12

# Complete combination
GET /api/members/salaries/paginated?page=1&limit=10&search=john&sort=amount&order=DESC&filter=month:12
```

### 6. Kasbons
```bash
# Basic pagination
GET /api/salaries/kasbons/paginated?page=1&limit=10

# Search kasbons
GET /api/salaries/kasbons/paginated?search=loan

# Sort by amount
GET /api/salaries/kasbons/paginated?sort=amount&order=DESC

# Filter by status
GET /api/salaries/kasbons/paginated?filter=status:pending

# Complete combination
GET /api/salaries/kasbons/paginated?page=1&limit=10&search=loan&sort=amount&order=DESC&filter=status:pending
```

### 7. Activities
```bash
# Basic pagination
GET /api/activities/paginated?page=1&limit=10

# Search activities
GET /api/activities/paginated?search=login

# Sort by timestamp
GET /api/activities/paginated?sort=timestamp&order=DESC

# Filter by type
GET /api/activities/paginated?filter=type:login

# Complete combination
GET /api/activities/paginated?page=1&limit=10&search=login&sort=timestamp&order=DESC&filter=type:login
```

## 📊 **Response Format**

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
  "error": "Error message",
  "status": 400
}
```

## 🔐 **Authentication**

Semua endpoint memerlukan authentication dengan Bearer token:

```bash
curl -X GET "http://localhost:8080/api/admin/users/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"
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

### 2. Projects
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/projects/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/projects/paginated?page=1&limit=10&search=construction&sort=start_date&order=DESC&filter=status:active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Members
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/members/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/members/paginated?page=1&limit=10&search=engineer&sort=join_date&order=DESC&filter=position:manager" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Finances
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/finance/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/finance/paginated?page=1&limit=10&search=salary&sort=amount&order=DESC&filter=type:income" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Salaries
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/members/salaries/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/members/salaries/paginated?page=1&limit=10&search=john&sort=amount&order=DESC&filter=month:12" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Kasbons
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/salaries/kasbons/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/salaries/kasbons/paginated?page=1&limit=10&search=loan&sort=amount&order=DESC&filter=status:pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Activities
```bash
# Basic pagination
curl -X GET "http://localhost:8080/api/activities/paginated" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With parameters
curl -X GET "http://localhost:8080/api/activities/paginated?page=1&limit=10&search=login&sort=timestamp&order=DESC&filter=type:login" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 **Notes**

1. **Default Values**:
   - page = 1
   - limit = 10
   - order = ASC

2. **Maximum Limits**:
   - limit = 100 (maximum)

3. **Search**: Case-insensitive search using ILIKE

4. **Filter Format**: "field1:value1,field2:value2"

5. **Sort Order**: ASC or DESC (case-insensitive)

6. **Authorization**: All endpoints require valid Bearer token

## 🚀 **Implementation Status**

- ✅ Users - Fully implemented
- ✅ Projects - Fully implemented  
- ✅ Members - Fully implemented
- ✅ Finances - Fully implemented
- ✅ Salaries - Fully implemented
- ✅ Kasbons - Fully implemented
- ✅ Activities - Fully implemented
- ⏳ Inventory - Pending implementation 