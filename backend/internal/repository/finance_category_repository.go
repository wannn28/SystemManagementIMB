package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type FinanceCategoryRepository interface {
	Create(cat *entity.FinanceCategoryModel) error
	Update(cat *entity.FinanceCategoryModel) error
	Delete(id uint) error
	FindAll() ([]entity.FinanceCategoryModel, error)
	FindByID(id uint) (*entity.FinanceCategoryModel, error)
	FindByName(name string) (*entity.FinanceCategoryModel, error)
}

type financeCategoryRepository struct{ db *gorm.DB }

func NewFinanceCategoryRepository(db *gorm.DB) FinanceCategoryRepository {
	return &financeCategoryRepository{db}
}

func (r *financeCategoryRepository) Create(cat *entity.FinanceCategoryModel) error {
	return r.db.Create(cat).Error
}
func (r *financeCategoryRepository) Update(cat *entity.FinanceCategoryModel) error {
	return r.db.Save(cat).Error
}
func (r *financeCategoryRepository) Delete(id uint) error {
	return r.db.Delete(&entity.FinanceCategoryModel{}, id).Error
}
func (r *financeCategoryRepository) FindAll() ([]entity.FinanceCategoryModel, error) {
	var items []entity.FinanceCategoryModel
	err := r.db.Order("name asc").Find(&items).Error
	return items, err
}
func (r *financeCategoryRepository) FindByID(id uint) (*entity.FinanceCategoryModel, error) {
	var item entity.FinanceCategoryModel
	err := r.db.First(&item, id).Error
	return &item, err
}
func (r *financeCategoryRepository) FindByName(name string) (*entity.FinanceCategoryModel, error) {
	var item entity.FinanceCategoryModel
	err := r.db.Where("name = ?", name).First(&item).Error
	return &item, err
}
