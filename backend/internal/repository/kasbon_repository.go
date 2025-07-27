package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"

	"gorm.io/gorm"
)

type KasbonRepository interface {
	Create(kasbon *entity.Kasbon) error
	Update(kasbon *entity.Kasbon) error
	Delete(id uint) error
	FindByID(id uint) (*entity.Kasbon, error)
	FindBySalaryID(salaryID uint) ([]entity.Kasbon, error)
	FindAllWithPagination(params response.QueryParams) ([]entity.Kasbon, int, error)
}

type kasbonRepository struct {
	db *gorm.DB
}

func NewKasbonRepository(db *gorm.DB) KasbonRepository {
	return &kasbonRepository{db}
}

func (r *kasbonRepository) Create(kasbon *entity.Kasbon) error {
	return r.db.Create(kasbon).Error
}

func (r *kasbonRepository) Update(kasbon *entity.Kasbon) error {
	return r.db.Save(kasbon).Error
}

func (r *kasbonRepository) Delete(id uint) error {
	return r.db.Delete(&entity.Kasbon{}, id).Error
}

func (r *kasbonRepository) FindBySalaryID(salaryID uint) ([]entity.Kasbon, error) {
	var kasbons []entity.Kasbon
	err := r.db.Where("salary_id = ?", salaryID).Find(&kasbons).Error
	return kasbons, err
}

func (r *kasbonRepository) FindByID(id uint) (*entity.Kasbon, error) {
	var kasbon entity.Kasbon
	err := r.db.First(&kasbon, id).Error
	return &kasbon, err
}

func (r *kasbonRepository) FindAllWithPagination(params response.QueryParams) ([]entity.Kasbon, int, error) {
	var kasbons []entity.Kasbon

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildKasbonQuery(params)

	total, err := queryBuilder.Paginate(query, params, &kasbons)
	if err != nil {
		return nil, 0, err
	}

	return kasbons, total, nil
}
