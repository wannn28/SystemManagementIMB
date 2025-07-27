package database

import (
	"fmt"
	"strings"

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
func (qb *QueryBuilder) BuildQuery(params response.QueryParams, searchFields []string, allowedSortFields []string, allowedFilterFields map[string]string) *gorm.DB {
	query := qb.DB

	// Apply search
	if params.Search != "" && len(searchFields) > 0 {
		searchConditions := make([]string, 0)
		searchArgs := make([]interface{}, 0)

		for _, field := range searchFields {
			searchConditions = append(searchConditions, fmt.Sprintf("%s ILIKE ?", field))
			searchArgs = append(searchArgs, "%"+params.Search+"%")
		}

		if len(searchConditions) > 0 {
			query = query.Where(strings.Join(searchConditions, " OR "), searchArgs...)
		}
	}

	// Apply sorting
	if params.Sort != "" && len(allowedSortFields) > 0 {
		if contains(allowedSortFields, params.Sort) {
			query = query.Order(fmt.Sprintf("%s %s", params.Sort, params.Order))
		}
	}

	// Apply filters
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

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return 0, err
	}

	// Apply pagination
	offset := (params.Page - 1) * params.Limit
	if err := query.Offset(offset).Limit(params.Limit).Find(result).Error; err != nil {
		return 0, err
	}

	return int(total), nil
}

// contains checks if a slice contains a specific value
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// parseFilters parses filter string in format "field1:value1,field2:value2"
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
	searchFields := []string{"name", "email", "phone"}
	allowedSortFields := []string{"id", "name", "email", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"role":   "role",
		"status": "status",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields)
}

// BuildProjectQuery builds a query specifically for projects
func (qb *QueryBuilder) BuildProjectQuery(params response.QueryParams) *gorm.DB {
	searchFields := []string{"name", "description", "location"}
	allowedSortFields := []string{"id", "name", "start_date", "end_date", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"status": "status",
		"type":   "type",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields)
}

// BuildMemberQuery builds a query specifically for members
func (qb *QueryBuilder) BuildMemberQuery(params response.QueryParams) *gorm.DB {
	searchFields := []string{"name", "email", "phone", "position"}
	allowedSortFields := []string{"id", "name", "position", "join_date", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"status":   "status",
		"position": "position",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields)
}

// BuildFinanceQuery builds a query specifically for finances
func (qb *QueryBuilder) BuildFinanceQuery(params response.QueryParams) *gorm.DB {
	searchFields := []string{"description", "category"}
	allowedSortFields := []string{"id", "amount", "date", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"type":     "type",
		"category": "category",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields)
}

// BuildInventoryQuery builds a query specifically for inventory
func (qb *QueryBuilder) BuildInventoryQuery(params response.QueryParams) *gorm.DB {
	searchFields := []string{"name", "description", "category"}
	allowedSortFields := []string{"id", "name", "quantity", "price", "created_at", "updated_at"}
	allowedFilterFields := map[string]string{
		"category": "category",
		"status":   "status",
	}

	return qb.BuildQuery(params, searchFields, allowedSortFields, allowedFilterFields)
}
