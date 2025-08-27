# Postman Collection Update Summary - Finance API

## Overview
The Postman collection has been comprehensively updated to include all the new Finance API endpoints with pagination, sorting, search filtering, and delete functionality.

## What Has Been Updated

### 1. **Finance Management Section Restructured**
The Finance section has been completely reorganized into logical groups:

#### 📝 **Basic CRUD Operations**
- **Create Finance** - POST `/api/finance` with updated request body
- **Get All Finance (Simple)** - GET `/api/finance` (without pagination)
- **Get Finance by ID** - GET `/api/finance/{id}`
- **Update Finance** - PUT `/api/finance/{id}` with updated request body
- **Delete Finance** - DELETE `/api/finance/{id}`

#### 📊 **Pagination & Advanced Queries**
- **Get All Finance with Pagination** - Basic pagination example
- **Pagination with Search** - Search + pagination
- **Pagination with Sorting** - Sort + pagination
- **Pagination with Complex Filtering** - Multiple filters + pagination
- **Pagination with Date Range Filter** - Date range + pagination
- **Pagination with Amount Range Filter** - Amount range + pagination
- **Complete Query Example** - All features combined

#### 🔍 **Enhanced Filtering**
- **Filter by Date Range - January 2024** - Monthly filtering
- **Filter by Date Range - Q1 2024** - Quarterly filtering
- **Filter by Amount Range - Small (100K-5M)** - Small transactions
- **Filter by Amount Range - Medium (5M-50M)** - Medium transactions
- **Filter by Amount Range - Large (50M+)** - Large transactions
- **Filter by Category - Barang** - Goods category
- **Filter by Category - Jasa** - Services category
- **Filter by Category - Gaji** - Salary category
- **Filter by Status - Paid** - Paid transactions
- **Filter by Status - Unpaid** - Unpaid transactions
- **Filter by Type - Expense with Pagination** - Expense transactions
- **Filter by Type - Income with Pagination** - Income transactions

#### 📈 **Analytics & Summary**
- **Get Financial Summary** - Income/expense totals
- **Get Monthly Comparison** - Monthly comparison data

## Key Improvements

### 1. **Updated Request Bodies**
- **Create Finance**: Now uses the correct field names (`tanggal`, `unit`, `hargaPerUnit`, `keterangan`, `type`, `category`, `status`)
- **Update Finance**: Updated with correct field structure
- **Proper Field Values**: Uses actual enum values (Barang, Jasa, Gaji, etc.)

### 2. **Comprehensive Query Parameters**
- **Pagination**: `page`, `limit` parameters
- **Search**: `search` parameter for text search
- **Sorting**: `sort` and `order` parameters
- **Filtering**: `filter` parameter with complex filter strings

### 3. **Real-World Examples**
- **Date Ranges**: January 2024, Q1 2024 examples
- **Amount Ranges**: Small (100K-5M), Medium (5M-50M), Large (50M+) examples
- **Categories**: Barang, Jasa, Gaji examples
- **Statuses**: Paid, Unpaid examples
- **Types**: Income, Expense examples

### 4. **Organized Structure**
- **Logical Grouping**: CRUD, Pagination, Filtering, Analytics
- **Clear Naming**: Descriptive names for each endpoint
- **Progressive Complexity**: From simple to complex examples

## Request Body Examples

### Create Finance
```json
{
  "tanggal": "2024-01-15",
  "unit": 5,
  "hargaPerUnit": 200000.00,
  "keterangan": "Pembelian material proyek",
  "type": "expense",
  "category": "Barang",
  "status": "Paid"
}
```

### Update Finance
```json
{
  "tanggal": "2024-01-15",
  "unit": 6,
  "hargaPerUnit": 200000.00,
  "keterangan": "Pembelian material proyek (updated)",
  "type": "expense",
  "category": "Barang",
  "status": "Paid"
}
```

## Query Parameter Examples

### Basic Pagination
```
GET /api/finance/paginated?page=1&limit=20
```

### With Search
```
GET /api/finance/paginated?page=1&limit=20&search=material
```

### With Sorting
```
GET /api/finance/paginated?page=1&limit=20&sort=jumlah&order=DESC
```

### With Complex Filtering
```
GET /api/finance/paginated?page=1&limit=20&filter=type:expense,category:Barang,status:Paid
```

### With Date Range
```
GET /api/finance/paginated?page=1&limit=20&filter=start_date:2024-01-01,end_date:2024-01-31
```

### With Amount Range
```
GET /api/finance/paginated?page=1&limit=20&filter=min_amount:100000,max_amount:5000000
```

### Complete Example
```
GET /api/finance/paginated?page=1&limit=20&search=material&sort=jumlah&order=DESC&filter=type:expense,category:Barang,status:Paid,start_date:2024-01-01,end_date:2024-01-31
```

## Filter Endpoints

### Date Range Filtering
```
GET /api/finance/filter/date-range?start_date=2024-01-01&end_date=2024-01-31
GET /api/finance/filter/date-range?start_date=2024-01-01&end_date=2024-03-31
```

### Amount Range Filtering
```
GET /api/finance/filter/amount-range?min_amount=100000&max_amount=5000000
GET /api/finance/filter/amount-range?min_amount=5000000&max_amount=50000000
GET /api/finance/filter/amount-range?min_amount=50000000&max_amount=999999999
```

### Category Filtering
```
GET /api/finance/filter/category?category=Barang
GET /api/finance/filter/category?category=Jasa
GET /api/finance/filter/category?category=Gaji
```

### Status Filtering
```
GET /api/finance/filter/status?status=Paid
GET /api/finance/filter/status?status=Unpaid
```

### Type Filtering with Pagination
```
GET /api/finance/filter/type?type=expense&page=1&limit=20&sort=jumlah&order=DESC
GET /api/finance/filter/type?type=income&page=1&limit=20&sort=jumlah&order=DESC
```

## Testing Scenarios

### 1. **Basic CRUD Testing**
- Create a new finance record
- Retrieve the created record
- Update the record
- Delete the record
- Verify deletion

### 2. **Pagination Testing**
- Test different page sizes (10, 20, 50)
- Test page navigation (page 1, 2, 3)
- Verify pagination metadata

### 3. **Search Testing**
- Search by keterangan text
- Search by category text
- Test with different search terms

### 4. **Sorting Testing**
- Sort by different fields (id, jumlah, tanggal)
- Test both ASC and DESC orders
- Verify sort results

### 5. **Filtering Testing**
- Test individual filters
- Test filter combinations
- Test with pagination
- Test with sorting

### 6. **Complex Query Testing**
- Combine multiple parameters
- Test edge cases
- Verify response format

## Benefits of Updated Collection

### 1. **For Developers**
- **Ready-to-use examples** for all endpoints
- **Proper request bodies** with correct field names
- **Comprehensive query parameters** for testing
- **Real-world scenarios** for development

### 2. **For Testing**
- **Organized structure** for easy navigation
- **Multiple examples** for each endpoint type
- **Progressive complexity** for learning
- **Complete coverage** of all features

### 3. **For Documentation**
- **Self-documenting** through examples
- **Consistent naming** conventions
- **Clear organization** by functionality
- **Easy to maintain** and update

## Usage Instructions

### 1. **Import Collection**
- Import `SystemManagementIMB_Collection.json` into Postman
- Set up environment variables (`base_url`, `token`)

### 2. **Authentication**
- Use the Login endpoint to get a JWT token
- Set the token in the environment variable
- All Finance endpoints will automatically use the token

### 3. **Testing Order**
- Start with Basic CRUD Operations
- Move to Pagination & Advanced Queries
- Test Enhanced Filtering endpoints
- Finish with Analytics & Summary

### 4. **Customization**
- Modify query parameters as needed
- Adjust request bodies for your data
- Add new examples for specific use cases

## Conclusion

The updated Postman collection now provides:

✅ **Complete coverage** of all Finance API endpoints  
✅ **Real-world examples** with proper request bodies  
✅ **Comprehensive testing scenarios** for all features  
✅ **Organized structure** for easy navigation  
✅ **Ready-to-use templates** for development and testing  

This collection serves as both a testing tool and a learning resource for developers working with the Finance API.
