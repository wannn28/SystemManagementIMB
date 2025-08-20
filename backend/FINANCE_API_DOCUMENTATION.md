# Finance API Documentation

## Overview
This document provides comprehensive documentation for the Finance API endpoints, including pagination, sorting, search filtering, and CRUD operations for managing financial records (income and expenses).

## Base URL
```
/api/finance
```

## Authentication
All endpoints require admin authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Data Models

### Finance Entity
```json
{
  "id": 1,
  "tanggal": "2024-01-15",
  "unit": 5,
  "jumlah": 1000000.00,
  "hargaPerUnit": 200000.00,
  "keterangan": "Pembelian material proyek",
  "type": "expense",
  "category": "Barang",
  "status": "Paid"
}
```

### Finance Types
- `income` - Pemasukan
- `expense` - Pengeluaran

### Finance Categories
- `Barang` - Barang
- `Jasa` - Jasa
- `Sewa Alat Berat` - Sewa Alat Berat
- `Gaji` - Gaji
- `Uang Makan` - Uang Makan
- `Kasbon` - Kasbon
- `Other` - Lainnya

### Finance Status
- `Paid` - Sudah Dibayar
- `Unpaid` - Belum Dibayar

## API Endpoints

### 1. Create Finance Record
**POST** `/api/finance`

Creates a new finance record.

**Request Body:**
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

**Response:**
```json
{
  "status": 201,
  "data": {
    "id": 1,
    "tanggal": "2024-01-15",
    "unit": 5,
    "jumlah": 1000000.00,
    "hargaPerUnit": 200000.00,
    "keterangan": "Pembelian material proyek",
    "type": "expense",
    "category": "Barang",
    "status": "Paid"
  }
}
```

**Notes:**
- `jumlah` is automatically calculated as `unit * hargaPerUnit`
- `tanggal` should be in "YYYY-MM-DD" format

### 2. Get All Finance Records (Simple)
**GET** `/api/finance`

Retrieves all finance records without pagination.

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "tanggal": "2024-01-15",
      "unit": 5,
      "jumlah": 1000000.00,
      "hargaPerUnit": 200000.00,
      "keterangan": "Pembelian material proyek",
      "type": "expense",
      "category": "Barang",
      "status": "Paid"
    }
  ]
}
```

### 3. Get All Finance Records with Pagination
**GET** `/api/finance/paginated`

Retrieves finance records with pagination, sorting, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10, max: 100)
- `search` (optional): Search term for keterangan and category fields
- `sort` (optional): Field to sort by (id, jumlah, tanggal, created_at, updated_at)
- `order` (optional): Sort order (ASC or DESC, default: ASC)
- `filter` (optional): Filter string in format "field1:value1,field2:value2"

**Filter Fields:**
- `type`: Filter by finance type (income/expense)
- `category`: Filter by category
- `status`: Filter by status (Paid/Unpaid)
- `start_date`: Start date for date range filter (YYYY-MM-DD)
- `end_date`: End date for date range filter (YYYY-MM-DD)
- `min_amount`: Minimum amount for amount range filter
- `max_amount`: Maximum amount for amount range filter

**Example Requests:**

**Basic pagination:**
```
GET /api/finance/paginated?page=1&limit=20
```

**With search:**
```
GET /api/finance/paginated?page=1&limit=20&search=material
```

**With sorting:**
```
GET /api/finance/paginated?page=1&limit=20&sort=jumlah&order=DESC
```

**With filtering:**
```
GET /api/finance/paginated?page=1&limit=20&filter=type:expense,category:Barang
```

**With date range filter:**
```
GET /api/finance/paginated?page=1&limit=20&filter=start_date:2024-01-01,end_date:2024-01-31
```

**With amount range filter:**
```
GET /api/finance/paginated?page=1&limit=20&filter=min_amount:100000,max_amount:5000000
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "tanggal": "2024-01-15",
      "unit": 5,
      "jumlah": 1000000.00,
      "hargaPerUnit": 200000.00,
      "keterangan": "Pembelian material proyek",
      "type": "expense",
      "category": "Barang",
      "status": "Paid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

### 4. Get Finance Record by ID
**GET** `/api/finance/{id}`

Retrieves a specific finance record by ID.

**Response:**
```json
{
  "status": 200,
  "data": {
    "id": 1,
    "tanggal": "2024-01-15",
    "unit": 5,
    "jumlah": 1000000.00,
    "hargaPerUnit": 200000.00,
    "keterangan": "Pembelian material proyek",
    "type": "expense",
    "category": "Barang",
    "status": "Paid"
  }
}
```

### 5. Update Finance Record
**PUT** `/api/finance/{id}`

Updates an existing finance record.

**Request Body:**
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

**Response:**
```json
{
  "status": 200,
  "data": {
    "id": 1,
    "tanggal": "2024-01-15",
    "unit": 6,
    "jumlah": 1200000.00,
    "hargaPerUnit": 200000.00,
    "keterangan": "Pembelian material proyek (updated)",
    "type": "expense",
    "category": "Barang",
    "status": "Paid"
  }
}
```

### 6. Delete Finance Record
**DELETE** `/api/finance/{id}`

Deletes a finance record by ID.

**Response:**
```json
{
  "status": 204,
  "data": null
}
```

### 7. Get Financial Summary
**GET** `/api/finance/summary`

Retrieves total income and expense amounts.

**Response:**
```json
{
  "status": 200,
  "data": {
    "income": 50000000.00,
    "expense": 35000000.00
  }
}
```

### 8. Get Monthly Comparison
**GET** `/api/finance/monthly`

Retrieves monthly income vs expense comparison.

**Response:**
```json
{
  "status": 200,
  "data": [
    {
      "month": "2024-01",
      "income": 25000000.00,
      "expense": 18000000.00
    },
    {
      "month": "2024-02",
      "income": 25000000.00,
      "expense": 17000000.00
    }
  ]
}
```

## Enhanced Filtering Endpoints

### 9. Filter by Date Range
**GET** `/api/finance/filter/date-range`

**Query Parameters:**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)

**Example:**
```
GET /api/finance/filter/date-range?start_date=2024-01-01&end_date=2024-01-31
```

### 10. Filter by Amount Range
**GET** `/api/finance/filter/amount-range`

**Query Parameters:**
- `min_amount`: Minimum amount
- `max_amount`: Maximum amount

**Example:**
```
GET /api/finance/filter/amount-range?min_amount=100000&max_amount=5000000
```

### 11. Filter by Category
**GET** `/api/finance/filter/category`

**Query Parameters:**
- `category`: Category name

**Example:**
```
GET /api/finance/filter/category?category=Barang
```

### 12. Filter by Status
**GET** `/api/finance/filter/status`

**Query Parameters:**
- `status`: Status (Paid/Unpaid)

**Example:**
```
GET /api/finance/filter/status?status=Paid
```

### 13. Filter by Type with Pagination
**GET** `/api/finance/filter/type`

**Query Parameters:**
- `type`: Finance type (income/expense)
- All pagination parameters (page, limit, search, sort, order, filter)

**Example:**
```
GET /api/finance/filter/type?type=expense&page=1&limit=20&sort=jumlah&order=DESC
```

## Error Handling

### Error Response Format
```json
{
  "status": 400,
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content (Delete)
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Missing/invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Validation Errors
- Missing required fields
- Invalid date format (use YYYY-MM-DD)
- Invalid finance type (must be 'income' or 'expense')
- Invalid category
- Invalid status (must be 'Paid' or 'Unpaid')
- Invalid amount format

## Frontend Implementation Examples

### React/TypeScript Example

```typescript
interface FinanceRecord {
  id: number;
  tanggal: string;
  unit: number;
  jumlah: number;
  hargaPerUnit: number;
  keterangan: string;
  type: 'income' | 'expense';
  category: string;
  status: 'Paid' | 'Unpaid';
}

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
  filter?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Fetch finance records with pagination
const fetchFinanceRecords = async (params: PaginationParams): Promise<PaginatedResponse<FinanceRecord>> => {
  const queryParams = new URLSearchParams();
  
  queryParams.append('page', params.page.toString());
  queryParams.append('limit', params.limit.toString());
  
  if (params.search) queryParams.append('search', params.search);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.order) queryParams.append('order', params.order);
  if (params.filter) queryParams.append('filter', params.filter);
  
  const response = await fetch(`/api/finance/paginated?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch finance records');
  }
  
  return response.json();
};

// Create finance record
const createFinanceRecord = async (record: Omit<FinanceRecord, 'id'>): Promise<FinanceRecord> => {
  const response = await fetch('/api/finance', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(record)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create finance record');
  }
  
  const result = await response.json();
  return result.data;
};

// Delete finance record
const deleteFinanceRecord = async (id: number): Promise<void> => {
  const response = await fetch(`/api/finance/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete finance record');
  }
};
```

### Vue.js Example

```javascript
// Finance API service
class FinanceService {
  constructor() {
    this.baseURL = '/api/finance';
    this.token = localStorage.getItem('token');
  }
  
  async getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
  
  async fetchWithPagination(params) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await fetch(`${this.baseURL}/paginated?${queryParams}`, {
      headers: await this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch finance records');
    }
    
    return response.json();
  }
  
  async create(record) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(record)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create finance record');
    }
    
    const result = await response.json();
    return result.data;
  }
  
  async update(id, record) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(record)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update finance record');
    }
    
    const result = await response.json();
    return result.data;
  }
  
  async delete(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: await this.getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete finance record');
    }
  }
}

export default new FinanceService();
```

## Best Practices

### 1. Pagination
- Always implement pagination for large datasets
- Use reasonable page sizes (10-50 records per page)
- Provide navigation controls (previous/next, page numbers)
- Show total record count and current page info

### 2. Search and Filtering
- Implement real-time search with debouncing
- Provide clear filter options with dropdowns/checkboxes
- Allow multiple filter combinations
- Show active filters with option to remove

### 3. Error Handling
- Display user-friendly error messages
- Implement retry mechanisms for failed requests
- Validate input before sending requests
- Handle network errors gracefully

### 4. Performance
- Implement caching for frequently accessed data
- Use loading states during API calls
- Implement infinite scroll for better UX
- Optimize images and data transfer

### 5. Security
- Always validate and sanitize user input
- Implement proper authentication checks
- Use HTTPS for all API calls
- Implement rate limiting on the frontend

## Testing

### Postman Collection
Import the provided Postman collection for testing all endpoints:
- `SystemManagementIMB_Collection.json`
- `SystemManagementIMB_Environment.json`

### Test Scenarios
1. **CRUD Operations**: Create, read, update, delete finance records
2. **Pagination**: Test different page sizes and navigation
3. **Search**: Test search functionality with various terms
4. **Filtering**: Test all filter combinations
5. **Sorting**: Test sorting by different fields
6. **Validation**: Test input validation and error handling
7. **Authentication**: Test with valid/invalid tokens

## Support

For technical support or questions about the API:
- Check the API documentation
- Review error logs
- Contact the backend development team
- Refer to the implementation examples above
