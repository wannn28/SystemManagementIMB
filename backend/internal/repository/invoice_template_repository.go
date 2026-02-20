package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type InvoiceTemplateRepository interface {
	Create(t *entity.InvoiceTemplate) error
	Update(t *entity.InvoiceTemplate) error
	Delete(id uint) error
	FindAll() ([]entity.InvoiceTemplate, error)
	FindByID(id uint) (*entity.InvoiceTemplate, error)
}

type invoiceTemplateRepository struct {
	db *gorm.DB
}

func NewInvoiceTemplateRepository(db *gorm.DB) InvoiceTemplateRepository {
	return &invoiceTemplateRepository{db: db}
}

func (r *invoiceTemplateRepository) Create(t *entity.InvoiceTemplate) error {
	normalizeTemplateOptions(t)
	return r.db.Create(t).Error
}

func (r *invoiceTemplateRepository) Update(t *entity.InvoiceTemplate) error {
	normalizeTemplateOptions(t)
	return r.db.Save(t).Error
}

// normalizeTemplateOptions sets empty Options to "{}" so MySQL JSON column accepts it.
func normalizeTemplateOptions(t *entity.InvoiceTemplate) {
	if t.Options == "" {
		t.Options = "{}"
	}
}

func (r *invoiceTemplateRepository) Delete(id uint) error {
	return r.db.Delete(&entity.InvoiceTemplate{}, id).Error
}

func (r *invoiceTemplateRepository) FindAll() ([]entity.InvoiceTemplate, error) {
	var list []entity.InvoiceTemplate
	err := r.db.Order("name ASC").Find(&list).Error
	return list, err
}

func (r *invoiceTemplateRepository) FindByID(id uint) (*entity.InvoiceTemplate, error) {
	var t entity.InvoiceTemplate
	err := r.db.First(&t, id).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}
