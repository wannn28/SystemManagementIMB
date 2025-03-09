// internal/repository/salary_detail_repository.go
package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type SalaryDetailRepository interface {
	Create(detail *entity.SalaryDetail) error
	Update(detail *entity.SalaryDetail) error
	Delete(id uint) error
	FindBySalaryID(salaryID uint) ([]entity.SalaryDetail, error)
}

type salaryDetailRepository struct {
	db *gorm.DB
}

func NewSalaryDetailRepository(db *gorm.DB) SalaryDetailRepository {
	return &salaryDetailRepository{db}
}

func (r *salaryDetailRepository) Create(detail *entity.SalaryDetail) error {
	return r.db.Create(detail).Error
}

func (r *salaryDetailRepository) Update(detail *entity.SalaryDetail) error {
	return r.db.Save(detail).Error
}

func (r *salaryDetailRepository) Delete(id uint) error {
	return r.db.Delete(&entity.SalaryDetail{}, id).Error
}

func (r *salaryDetailRepository) FindBySalaryID(salaryID uint) ([]entity.SalaryDetail, error) {
	var details []entity.SalaryDetail
	err := r.db.Where("salary_id = ?", salaryID).Find(&details).Error
	return details, err
}

// Implementasi serupa untuk KasbonRepository
func (r *salaryDetailRepository) CreateKasbon(kasbon *entity.Kasbon) error {
	return r.db.Create(kasbon).Error
}

func (r *salaryDetailRepository) UpdateKasbon(kasbon *entity.Kasbon) error {
	return r.db.Save(kasbon).Error
}

func (r *salaryDetailRepository) DeleteKasbon(id uint) error {
	return r.db.Delete(&entity.Kasbon{}, id).Error
}

func (r *salaryDetailRepository) FindBySalaryIDKasbon(salaryID uint) ([]entity.Kasbon, error) {
	var kasbons []entity.Kasbon
	err := r.db.Where("salary_id = ?", salaryID).Find(&kasbons).Error
	return kasbons, err
}
