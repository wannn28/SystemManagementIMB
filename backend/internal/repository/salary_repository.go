// internal/repository/salary_repository.go
package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"

	"gorm.io/gorm"
)

type SalaryRepository interface {
	Create(salary *entity.Salary) error
	Update(salary *entity.Salary) error
	Delete(salary *entity.Salary) error
	FindByMemberID(memberID string) ([]entity.Salary, error)
	FindByID(id uint) (*entity.Salary, error)
	FindAllWithPagination(params response.QueryParams) ([]entity.Salary, int, error)
}

type salaryRepository struct {
	db *gorm.DB
}

func NewSalaryRepository(db *gorm.DB) SalaryRepository {
	return &salaryRepository{db}
}

func (r *salaryRepository) Create(salary *entity.Salary) error {
	return r.db.Create(salary).Error
}

func (r *salaryRepository) Update(salary *entity.Salary) error {
	return r.db.Save(salary).Error
}

func (r *salaryRepository) Delete(salary *entity.Salary) error {
	return r.db.Delete(salary).Error
}

func (r *salaryRepository) FindByMemberID(memberID string) ([]entity.Salary, error) {
	var salaries []entity.Salary
	err := r.db.Where("member_id = ?", memberID).Find(&salaries).Error
	return salaries, err
}

func (r *salaryRepository) FindByID(id uint) (*entity.Salary, error) {
	var salary entity.Salary
	err := r.db.First(&salary, id).Error
	return &salary, err
}

func (r *salaryRepository) FindAllWithPagination(params response.QueryParams) ([]entity.Salary, int, error) {
	var salaries []entity.Salary

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildSalaryQuery(params)

	total, err := queryBuilder.Paginate(query, params, &salaries)
	if err != nil {
		return nil, 0, err
	}

	return salaries, total, nil
}
