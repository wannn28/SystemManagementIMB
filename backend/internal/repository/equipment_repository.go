package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type EquipmentRepository interface {
	Create(e *entity.Equipment) error
	Update(e *entity.Equipment) error
	Delete(id uint) error
	FindAll(search string, typ string) ([]entity.Equipment, error)
	FindByID(id uint) (*entity.Equipment, error)
}

type equipmentRepository struct {
	db *gorm.DB
}

func NewEquipmentRepository(db *gorm.DB) EquipmentRepository {
	return &equipmentRepository{db: db}
}

func (r *equipmentRepository) Create(e *entity.Equipment) error {
	return r.db.Create(e).Error
}

func (r *equipmentRepository) Update(e *entity.Equipment) error {
	return r.db.Save(e).Error
}

func (r *equipmentRepository) Delete(id uint) error {
	return r.db.Delete(&entity.Equipment{}, id).Error
}

func (r *equipmentRepository) FindAll(search string, typ string) ([]entity.Equipment, error) {
	var list []entity.Equipment
	q := r.db.Order("name ASC")
	if search != "" {
		q = q.Where("name LIKE ?", "%"+search+"%")
	}
	if typ != "" {
		q = q.Where("type = ?", typ)
	}
	err := q.Find(&list).Error
	return list, err
}

func (r *equipmentRepository) FindByID(id uint) (*entity.Equipment, error) {
	var e entity.Equipment
	err := r.db.First(&e, id).Error
	if err != nil {
		return nil, err
	}
	return &e, nil
}
