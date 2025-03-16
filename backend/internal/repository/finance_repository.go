package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type FinanceRepository interface {
	Create(finance *entity.Finance) error
	Update(finance *entity.Finance) error
	Delete(id uint) error
	FindAll() ([]entity.Finance, error)
	FindByID(id uint) (*entity.Finance, error)
	FindByType(fType entity.FinanceType) ([]entity.Finance, error)
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
