package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type ProjectIncomeRepository interface {
	Create(income *entity.ProjectIncome) error
	Update(income *entity.ProjectIncome) error
	Delete(id int) error
	FindByID(id int) (*entity.ProjectIncome, error)
	FindByProjectID(projectID int) ([]entity.ProjectIncome, error)
	FindAll() ([]entity.ProjectIncome, error)
	GetTotalIncomeByProject(projectID int) (float64, error)
}

type projectIncomeRepository struct {
	db *gorm.DB
}

func NewProjectIncomeRepository(db *gorm.DB) ProjectIncomeRepository {
	return &projectIncomeRepository{db}
}

func (r *projectIncomeRepository) Create(income *entity.ProjectIncome) error {
	return r.db.Create(income).Error
}

func (r *projectIncomeRepository) Update(income *entity.ProjectIncome) error {
	return r.db.Save(income).Error
}

func (r *projectIncomeRepository) Delete(id int) error {
	return r.db.Delete(&entity.ProjectIncome{}, id).Error
}

func (r *projectIncomeRepository) FindByID(id int) (*entity.ProjectIncome, error) {
	var income entity.ProjectIncome
	if err := r.db.First(&income, id).Error; err != nil {
		return nil, err
	}
	return &income, nil
}

func (r *projectIncomeRepository) FindByProjectID(projectID int) ([]entity.ProjectIncome, error) {
	var incomes []entity.ProjectIncome
	if err := r.db.Where("project_id = ?", projectID).
		Order("tanggal DESC").
		Find(&incomes).Error; err != nil {
		return nil, err
	}
	return incomes, nil
}

func (r *projectIncomeRepository) FindAll() ([]entity.ProjectIncome, error) {
	var incomes []entity.ProjectIncome
	if err := r.db.Order("tanggal DESC").Find(&incomes).Error; err != nil {
		return nil, err
	}
	return incomes, nil
}

func (r *projectIncomeRepository) GetTotalIncomeByProject(projectID int) (float64, error) {
	var total float64
	err := r.db.Model(&entity.ProjectIncome{}).
		Where("project_id = ? AND status = ?", projectID, "Received").
		Select("COALESCE(SUM(jumlah), 0)").
		Scan(&total).Error
	return total, err
}

