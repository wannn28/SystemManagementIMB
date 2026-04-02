package database

import (
	"fmt"
	"strings"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/response"

	"gorm.io/gorm"
)

// QueryBuilder helps build database queries with pagination, search, sort, and filter
type QueryBuilder struct {
	DB *gorm.DB
}

// NewQueryBuilder creates a new query builder instance
func NewQueryBuilder(db *gorm.DB) *QueryBuilder {
	return &QueryBuilder{DB: db}
}

// BuildQuery builds a query with pagination, search, sort, and filter
func (qb *QueryBuilder) BuildQuery(params response.QueryParams, searchFields []string, allowedSortFields []string, allowedFilterFields map[string]string, model interface{}) *gorm.DB {
	query := qb.DB.Model(model)

	if params.Search != "" && len(searchFields) > 0 {
		searchConditions := make([]string, 0)
		searchArgs := make([]interface{}, 0)

		for _, field := range searchFields {
			searchConditions = append(searchConditions, fmt.Sprintf("%s LIKE ?", field))
			searchArgs = append(searchArgs, "%"+params.Search+"%")
		}

		if len(searchConditions) > 0 {
			query = query.Where(strings.Join(searchConditions, " OR "), searchArgs...)
		}
	}

	if params.Sort != "" && len(allowedSortFields) > 0 {
		if contains(allowedSortFields, params.Sort) {
			query = query.Order(fmt.Sprintf("%s %s", params.Sort, params.Order))
		}
	}

	if params.Filter != "" && len(allowedFilterFields) > 0 {
		filters := parseFilters(params.Filter)
		for field, value := range filters {
			if dbField, exists := allowedFilterFields[field]; exists {
				query = query.Where(fmt.Sprintf("%s = ?", dbField), value)
			}
		}
	}

	return query
}

// Paginate applies pagination to the query
func (qb *QueryBuilder) Paginate(query *gorm.DB, params response.QueryParams, result interface{}) (int, error) {
	var total int64

	if err := query.Count(&total).Error; err != nil {
		return 0, err
	}

	offset := (params.Page - 1) * params.Limit
	if err := query.Offset(offset).Limit(params.Limit).Find(result).Error; err != nil {
		return 0, err
	}

	return int(total), nil
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func parseFilters(filterStr string) map[string]string {
	filters := make(map[string]string)

	if filterStr == "" {
		return filters
	}

	pairs := strings.Split(filterStr, ",")
	for _, pair := range pairs {
		parts := strings.SplitN(pair, ":", 2)
		if len(parts) == 2 {
			filters[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}

	return filters
}

// BuildUserQuery builds a query specifically for users
func (qb *QueryBuilder) BuildUserQuery(params response.QueryParams) *gorm.DB {
	searchFields := []string{"name", "email"}
	allowedSortFields := []string{"id", "name", "email", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"role": "role",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.User{})
}

// BuildProjectQuery builds a query specifically for projects, scoped to userID
func (qb *QueryBuilder) BuildProjectQuery(params response.QueryParams, userID uint) *gorm.DB {
	searchFields := []string{"name", "description", "status"}
	allowedSortFields := []string{"id", "name", "start_date", "end_date", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"status": "status",
	}

	query := qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.Project{})
	return query.Where("user_id = ?", userID)
}

// BuildMemberQuery builds a query specifically for members, scoped to userID
func (qb *QueryBuilder) BuildMemberQuery(params response.QueryParams, userID uint) *gorm.DB {
	searchFields := []string{"full_name", "role", "phone_number"}
	allowedSortFields := []string{"id", "full_name", "role", "join_date", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"role": "role",
	}

	query := qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.Member{})
	query = query.Where("user_id = ?", userID)

	if params.Filter != "" {
		filters := parseFilters(params.Filter)
		if v, ok := filters["is_active"]; ok {
			active := strings.EqualFold(v, "true") || v == "1"
			query = query.Where("is_active = ?", active)
		}
	}

	return query
}

// BuildFinanceQuery builds a query specifically for finances, scoped to userID
func (qb *QueryBuilder) BuildFinanceQuery(params response.QueryParams, userID uint) *gorm.DB {
	searchFields := []string{"keterangan", "category", "vendor_name", "no_bukti"}
	allowedSortFields := []string{
		"id", "jumlah", "tanggal", "status", "tax_paid",
		"payment_method", "kategori_utama", "vendor_name",
		"tanggal_bayar", "jatuh_tempo", "is_deductible",
		"created_at", "updated_at",
	}
	allowedFilterFields := map[string]string{
		"type":           "type",
		"category":       "category",
		"status":         "status",
		"tax_paid":       "tax_paid",
		"project_id":     "project_id",
		"payment_method": "payment_method",
		"kategori_utama": "kategori_utama",
		"is_deductible":  "is_deductible",
	}

	query := qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.Finance{})
	return query.Where("user_id = ?", userID)
}

// BuildInventoryQuery builds a query specifically for inventory
func (qb *QueryBuilder) BuildInventoryQuery(params response.QueryParams) *gorm.DB {
	searchFields := []string{"name", "description", "category"}
	allowedSortFields := []string{"id", "name", "quantity", "price", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"category": "category",
		"status":   "status",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.InventoryData{})
}

// BuildSalaryQuery builds a query specifically for salaries
func (qb *QueryBuilder) BuildSalaryQuery(params response.QueryParams) *gorm.DB {
	searchFields := []string{"member_id", "month"}
	allowedSortFields := []string{"id", "member_id", "salary", "month", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"member_id": "member_id",
		"status":    "status",
		"month":     "month",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.Salary{})
}

// BuildKasbonQuery builds a query specifically for kasbon
func (qb *QueryBuilder) BuildKasbonQuery(params response.QueryParams) *gorm.DB {
	searchFields := []string{"keterangan", "salary_id"}
	allowedSortFields := []string{"id", "salary_id", "jumlah", "tanggal", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"salary_id": "salary_id",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.Kasbon{})
}

// BuildActivityQuery builds a query specifically for activities, scoped to userID
func (qb *QueryBuilder) BuildActivityQuery(params response.QueryParams, userID uint) *gorm.DB {
	searchFields := []string{"title", "description", "type"}
	allowedSortFields := []string{"id", "type", "timestamp", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"type": "type",
	}

	query := qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.Activity{})
	return query.Where("user_id = ?", userID)
}

// BuildInvoiceQuery builds a query for invoices, scoped to userID
func (qb *QueryBuilder) BuildInvoiceQuery(params response.QueryParams, userID uint) *gorm.DB {
	searchFields := []string{"invoice_number", "customer_name", "customer_email"}
	allowedSortFields := []string{"id", "invoice_number", "invoice_date", "created_at", "total", "status"}
	allowedFilterFields := map[string]string{
		"status":      "status",
		"template_id": "template_id",
	}

	query := qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields, &entity.Invoice{})
	return query.Where("user_id = ?", userID)
}
