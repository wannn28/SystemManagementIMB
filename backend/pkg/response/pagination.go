package response

import (
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
)

// PaginationResponse represents the pagination metadata
type PaginationResponse struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	Total      int  `json:"total"`
	TotalPages int  `json:"total_pages"`
	HasNext    bool `json:"has_next"`
	HasPrev    bool `json:"has_prev"`
}

// QueryParams represents common query parameters for pagination, search, sort, and filter
type QueryParams struct {
	Page   int    `query:"page"`
	Limit  int    `query:"limit"`
	Search string `query:"search"`
	Sort   string `query:"sort"`
	Order  string `query:"order"`
	Filter string `query:"filter"`
}

// PaginatedResponse represents a paginated response with data and pagination info
type PaginatedResponse struct {
	Data       interface{}        `json:"data"`
	Pagination PaginationResponse `json:"pagination"`
}

// ParseQueryParams parses query parameters from echo context
func ParseQueryParams(c echo.Context) QueryParams {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 {
		page = 1
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 10
	}
	if limit > 100000 {
		limit = 100000
	}

	search := c.QueryParam("search")
	sort := c.QueryParam("sort")
	order := strings.ToUpper(c.QueryParam("order"))
	if order != "ASC" && order != "DESC" {
		order = "ASC"
	}
	filter := c.QueryParam("filter")

	return QueryParams{
		Page:   page,
		Limit:  limit,
		Search: search,
		Sort:   sort,
		Order:  order,
		Filter: filter,
	}
}

// CalculatePagination calculates pagination metadata
func CalculatePagination(page, limit, total int) PaginationResponse {
	totalPages := (total + limit - 1) / limit
	if totalPages == 0 {
		totalPages = 1
	}

	return PaginationResponse{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    page < totalPages,
		HasPrev:    page > 1,
	}
}

// SuccessWithPagination returns a success response with pagination
func SuccessWithPagination(c echo.Context, statusCode int, data interface{}, pagination PaginationResponse) error {
	response := PaginatedResponse{
		Data:       data,
		Pagination: pagination,
	}
	return c.JSON(statusCode, response)
}
