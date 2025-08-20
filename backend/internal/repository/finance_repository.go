package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"
	"strings"

	"gorm.io/gorm"
)

type FinanceRepository interface {
	Create(finance *entity.Finance) error
	Update(finance *entity.Finance) error
	Delete(id uint) error
	FindAll() ([]entity.Finance, error)
	FindAllWithPagination(params response.QueryParams) ([]entity.Finance, int, error)
	FindByID(id uint) (*entity.Finance, error)
	FindByType(fType entity.FinanceType) ([]entity.Finance, error)
	GetFinancialSummary() (income float64, expense float64, err error)
	GetMonthlyComparison() ([]entity.MonthlyComparison, error)
	GetFinanceByDateRange(startDate, endDate string) ([]entity.Finance, error)
	GetFinanceByAmountRange(minAmount, maxAmount float64) ([]entity.Finance, error)
	GetFinanceByCategory(category entity.FinanceCategory) ([]entity.Finance, error)
	GetFinanceByStatus(status string) ([]entity.Finance, error)
}

type financeRepository struct {
	db *gorm.DB
}

func NewFinanceRepository(db *gorm.DB) FinanceRepository {
	return &financeRepository{db}
}

func (r *financeRepository) Create(finance *entity.Finance) error {
	return r.db.Create(finance).Error
}

func (r *financeRepository) Update(finance *entity.Finance) error {
	return r.db.Save(finance).Error
}

func (r *financeRepository) Delete(id uint) error {
	return r.db.Delete(&entity.Finance{}, id).Error
}

func (r *financeRepository) FindAll() ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Find(&finances).Error
	return finances, err
}

func (r *financeRepository) FindByID(id uint) (*entity.Finance, error) {
	var finance entity.Finance
	err := r.db.First(&finance, id).Error
	return &finance, err
}

func (r *financeRepository) FindByType(fType entity.FinanceType) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("type = ?", fType).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetFinancialSummary() (income float64, expense float64, err error) {
	err = r.db.Model(&entity.Finance{}).
		Select("SUM(CASE WHEN type = 'income' THEN jumlah ELSE 0 END)").
		Scan(&income).Error
	if err != nil {
		return
	}

	err = r.db.Model(&entity.Finance{}).
		Select("SUM(CASE WHEN type = 'expense' THEN jumlah ELSE 0 END)").
		Scan(&expense).Error
	return
}

func (r *financeRepository) GetMonthlyComparison() ([]entity.MonthlyComparison, error) {
	var results []entity.MonthlyComparison
	err := r.db.Model(&entity.Finance{}).
		Select("DATE_FORMAT(tanggal, '%Y-%m') as month, " +
			"SUM(CASE WHEN type = 'income' THEN jumlah ELSE 0 END) as income, " +
			"SUM(CASE WHEN type = 'expense' THEN jumlah ELSE 0 END) as expense").
		Group("month").
		Order("month").
		Find(&results).Error
	return results, err
}

func (r *financeRepository) GetFinanceByDateRange(startDate, endDate string) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("tanggal BETWEEN ? AND ?", startDate, endDate).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetFinanceByAmountRange(minAmount, maxAmount float64) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("jumlah BETWEEN ? AND ?", minAmount, maxAmount).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetFinanceByCategory(category entity.FinanceCategory) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("category = ?", category).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetFinanceByStatus(status string) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("status = ?", status).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) FindAllWithPagination(params response.QueryParams) ([]entity.Finance, int, error) {
	var finances []entity.Finance

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildFinanceQuery(params)

	// Apply additional custom filters for finance
	query = r.applyCustomFinanceFilters(query, params)

	total, err := queryBuilder.Paginate(query, params, &finances)
	if err != nil {
		return nil, 0, err
	}

	return finances, total, nil
}

// applyCustomFinanceFilters applies finance-specific filters
func (r *financeRepository) applyCustomFinanceFilters(query *gorm.DB, params response.QueryParams) *gorm.DB {
	// Parse custom filter parameters
	if params.Filter != "" {
		filters := parseCustomFilters(params.Filter)

		// Apply date range filter
		if startDate, exists := filters["start_date"]; exists {
			if endDate, exists := filters["end_date"]; exists {
				query = query.Where("tanggal BETWEEN ? AND ?", startDate, endDate)
			}
		}

		// Apply amount range filter
		if minAmount, exists := filters["min_amount"]; exists {
			if maxAmount, exists := filters["max_amount"]; exists {
				query = query.Where("jumlah BETWEEN ? AND ?", minAmount, maxAmount)
			}
		}

		// Apply type filter
		if fType, exists := filters["type"]; exists {
			query = query.Where("type = ?", fType)
		}

		// Apply category filter
		if category, exists := filters["category"]; exists {
			query = query.Where("category = ?", category)
		}

		// Apply status filter
		if status, exists := filters["status"]; exists {
			query = query.Where("status = ?", status)
		}
	}

	return query
}

// parseCustomFilters parses custom filter string in format "field1:value1,field2:value2"
func parseCustomFilters(filterStr string) map[string]string {
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
