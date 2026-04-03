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
	FindAll(userID uint) ([]entity.Finance, error)
	FindAllWithPagination(params response.QueryParams, userID uint) ([]entity.Finance, int, error)
	FindByID(id uint) (*entity.Finance, error)
	FindByType(userID uint, fType entity.FinanceType) ([]entity.Finance, error)
	GetFinancialSummary(userID uint) (income float64, expense float64, err error)
	GetMonthlyComparison(userID uint) ([]entity.MonthlyComparison, error)
	GetFinanceByDateRange(userID uint, startDate, endDate string) ([]entity.Finance, error)
	GetFinanceByAmountRange(userID uint, minAmount, maxAmount float64) ([]entity.Finance, error)
	GetFinanceByCategory(userID uint, category entity.FinanceCategory) ([]entity.Finance, error)
	GetFinanceByStatus(userID uint, status string) ([]entity.Finance, error)
	GetMonthlySummaryByEquipment(userID uint, monthYYYYMM string) ([]entity.EquipmentMonthlyFinanceRow, error)
	SumLifetimeFinanceByEquipment(userID uint) ([]entity.EquipmentFinanceSumRow, error)
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

func (r *financeRepository) FindAll(userID uint) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("user_id = ?", userID).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) FindByID(id uint) (*entity.Finance, error) {
	var finance entity.Finance
	err := r.db.First(&finance, id).Error
	return &finance, err
}

func (r *financeRepository) FindByType(userID uint, fType entity.FinanceType) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("user_id = ? AND type = ?", userID, fType).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetFinancialSummary(userID uint) (income float64, expense float64, err error) {
	err = r.db.Model(&entity.Finance{}).
		Where("user_id = ?", userID).
		Select("SUM(CASE WHEN type = 'income' THEN jumlah ELSE 0 END)").
		Scan(&income).Error
	if err != nil {
		return
	}

	err = r.db.Model(&entity.Finance{}).
		Where("user_id = ?", userID).
		Select("SUM(CASE WHEN type = 'expense' THEN jumlah ELSE 0 END)").
		Scan(&expense).Error
	return
}

func (r *financeRepository) GetMonthlyComparison(userID uint) ([]entity.MonthlyComparison, error) {
	var results []entity.MonthlyComparison
	err := r.db.Model(&entity.Finance{}).
		Where("user_id = ?", userID).
		Select("DATE_FORMAT(tanggal, '%Y-%m') as month, " +
			"SUM(CASE WHEN type = 'income' THEN jumlah ELSE 0 END) as income, " +
			"SUM(CASE WHEN type = 'expense' THEN jumlah ELSE 0 END) as expense").
		Group("month").
		Order("month").
		Find(&results).Error
	return results, err
}

func (r *financeRepository) GetFinanceByDateRange(userID uint, startDate, endDate string) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("user_id = ? AND tanggal BETWEEN ? AND ?", userID, startDate, endDate).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetFinanceByAmountRange(userID uint, minAmount, maxAmount float64) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("user_id = ? AND jumlah BETWEEN ? AND ?", userID, minAmount, maxAmount).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetFinanceByCategory(userID uint, category entity.FinanceCategory) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("user_id = ? AND category = ?", userID, category).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetFinanceByStatus(userID uint, status string) ([]entity.Finance, error) {
	var finances []entity.Finance
	err := r.db.Where("user_id = ? AND status = ?", userID, status).Find(&finances).Error
	return finances, err
}

func (r *financeRepository) GetMonthlySummaryByEquipment(userID uint, monthYYYYMM string) ([]entity.EquipmentMonthlyFinanceRow, error) {
	var rows []entity.EquipmentMonthlyFinanceRow
	err := r.db.Raw(`
		SELECT
			e.id AS equipment_id,
			e.name AS equipment_name,
			e.type AS equipment_type,
			COALESCE(SUM(CASE WHEN f.type = 'income' THEN f.jumlah ELSE 0 END), 0) AS income,
			COALESCE(SUM(CASE WHEN f.type = 'expense' THEN f.jumlah ELSE 0 END), 0) AS expense
		FROM finances f
		INNER JOIN equipment e ON e.id = f.equipment_id AND e.user_id = f.user_id
		WHERE f.user_id = ?
			AND f.equipment_id IS NOT NULL
			AND DATE_FORMAT(f.tanggal, '%Y-%m') = ?
		GROUP BY e.id, e.name, e.type
		ORDER BY e.name ASC
	`, userID, monthYYYYMM).Scan(&rows).Error
	return rows, err
}

func (r *financeRepository) SumLifetimeFinanceByEquipment(userID uint) ([]entity.EquipmentFinanceSumRow, error) {
	var rows []entity.EquipmentFinanceSumRow
	err := r.db.Raw(`
		SELECT
			equipment_id,
			COALESCE(SUM(CASE WHEN type = 'income' THEN jumlah ELSE 0 END), 0) AS income,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN jumlah ELSE 0 END), 0) AS expense
		FROM finances
		WHERE user_id = ? AND equipment_id IS NOT NULL
		GROUP BY equipment_id
	`, userID).Scan(&rows).Error
	return rows, err
}

func (r *financeRepository) FindAllWithPagination(params response.QueryParams, userID uint) ([]entity.Finance, int, error) {
	var finances []entity.Finance

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildFinanceQuery(params, userID)

	query = r.applyCustomFinanceFilters(query, params)

	total, err := queryBuilder.Paginate(query, params, &finances)
	if err != nil {
		return nil, 0, err
	}

	return finances, total, nil
}

func (r *financeRepository) applyCustomFinanceFilters(query *gorm.DB, params response.QueryParams) *gorm.DB {
	if params.Filter != "" {
		filters := parseCustomFilters(params.Filter)

		if startDate, exists := filters["start_date"]; exists {
			if endDate, exists := filters["end_date"]; exists {
				query = query.Where("tanggal BETWEEN ? AND ?", startDate, endDate)
			}
		}

		if minAmount, exists := filters["min_amount"]; exists {
			if maxAmount, exists := filters["max_amount"]; exists {
				query = query.Where("jumlah BETWEEN ? AND ?", minAmount, maxAmount)
			}
		}

		if fType, exists := filters["type"]; exists {
			query = query.Where("type = ?", fType)
		}

		if category, exists := filters["category"]; exists {
			query = query.Where("category = ?", category)
		}

		if status, exists := filters["status"]; exists {
			query = query.Where("status = ?", status)
		}

		if taxPaid, exists := filters["tax_paid"]; exists {
			query = query.Where("tax_paid = ?", taxPaid)
		}

		if pm, exists := filters["payment_method"]; exists {
			query = query.Where("payment_method = ?", pm)
		}

		if ku, exists := filters["kategori_utama"]; exists {
			query = query.Where("kategori_utama = ?", ku)
		}

		if isd, exists := filters["is_deductible"]; exists {
			query = query.Where("is_deductible = ?", isd)
		}

		if eq, exists := filters["equipment_id"]; exists && eq != "" {
			if eq == "none" || eq == "null" {
				query = query.Where("equipment_id IS NULL")
			} else {
				query = query.Where("equipment_id = ?", eq)
			}
		}
	}

	return query
}

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
