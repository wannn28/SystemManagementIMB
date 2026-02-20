package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type CustomerRepository interface {
	Create(c *entity.Customer) error
	Update(c *entity.Customer) error
	Delete(id uint) error
	FindAll(search string) ([]entity.Customer, error)
	FindByID(id uint) (*entity.Customer, error)
}

type customerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) CustomerRepository {
	return &customerRepository{db: db}
}

func (r *customerRepository) Create(c *entity.Customer) error {
	return r.db.Create(c).Error
}

func (r *customerRepository) Update(c *entity.Customer) error {
	return r.db.Save(c).Error
}

func (r *customerRepository) Delete(id uint) error {
	return r.db.Delete(&entity.Customer{}, id).Error
}

func (r *customerRepository) FindAll(search string) ([]entity.Customer, error) {
	var list []entity.Customer
	q := r.db.Order("name ASC")
	if search != "" {
		q = q.Where("name LIKE ? OR phone LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	err := q.Find(&list).Error
	return list, err
}

func (r *customerRepository) FindByID(id uint) (*entity.Customer, error) {
	var c entity.Customer
	err := r.db.First(&c, id).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}
