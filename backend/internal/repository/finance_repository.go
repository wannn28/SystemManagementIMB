package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"

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

func (r *financeRepository) FindAllWithPagination(params response.QueryParams) ([]entity.Finance, int, error) {
	var finances []entity.Finance

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildFinanceQuery(params)

	total, err := queryBuilder.Paginate(query, params, &finances)
	if err != nil {
		return nil, 0, err
	}

	return finances, total, nil
}
