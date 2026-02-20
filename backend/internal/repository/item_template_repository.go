package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type ItemTemplateRepository interface {
	Create(e *entity.ItemTemplate) error
	Update(e *entity.ItemTemplate) error
	Delete(id uint) error
	FindAll(search string) ([]entity.ItemTemplate, error)
	FindByID(id uint) (*entity.ItemTemplate, error)
}

type itemTemplateRepository struct {
	db *gorm.DB
}

func NewItemTemplateRepository(db *gorm.DB) ItemTemplateRepository {
	return &itemTemplateRepository{db: db}
}

func (r *itemTemplateRepository) Create(e *entity.ItemTemplate) error {
	return r.db.Create(e).Error
}

func (r *itemTemplateRepository) Update(e *entity.ItemTemplate) error {
	return r.db.Save(e).Error
}

func (r *itemTemplateRepository) Delete(id uint) error {
	return r.db.Delete(&entity.ItemTemplate{}, id).Error
}

func (r *itemTemplateRepository) FindAll(search string) ([]entity.ItemTemplate, error) {
	var list []entity.ItemTemplate
	q := r.db.Order("name ASC")
	if search != "" {
		q = q.Where("name LIKE ?", "%"+search+"%")
	}
	err := q.Find(&list).Error
	return list, err
}

func (r *itemTemplateRepository) FindByID(id uint) (*entity.ItemTemplate, error) {
	var e entity.ItemTemplate
	err := r.db.First(&e, id).Error
	if err != nil {
		return nil, err
	}
	return &e, nil
}
