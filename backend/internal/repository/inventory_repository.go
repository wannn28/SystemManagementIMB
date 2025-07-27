package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"

	"gorm.io/gorm"
)

type InventoryRepository interface {
	CreateCategory(category *entity.InventoryCategory) error
	UpdateCategory(category *entity.InventoryCategory) error
	DeleteCategory(id string) error
	GetAllCategories() ([]entity.InventoryCategory, error)
	GetCategoryByID(id string) (*entity.InventoryCategory, error)

	CreateData(data *entity.InventoryData) error
	UpdateData(data *entity.InventoryData) error
	DeleteData(id string) error
	GetDataByCategory(categoryID string) ([]entity.InventoryData, error)
	GetDataByID(id string) (*entity.InventoryData, error)

	FindAllWithPagination(params response.QueryParams) ([]entity.InventoryData, int, error)
}

type inventoryRepository struct {
	db *gorm.DB
}

func NewInventoryRepository(db *gorm.DB) InventoryRepository {
	return &inventoryRepository{db}
}

func (r *inventoryRepository) CreateCategory(category *entity.InventoryCategory) error {
	return r.db.Create(category).Error
}

func (r *inventoryRepository) UpdateCategory(category *entity.InventoryCategory) error {
	return r.db.Save(category).Error
}

func (r *inventoryRepository) DeleteCategory(id string) error {
	return r.db.Where("id = ?", id).Delete(&entity.InventoryCategory{}).Error
}

func (r *inventoryRepository) GetAllCategories() ([]entity.InventoryCategory, error) {
	var categories []entity.InventoryCategory
	err := r.db.Preload("Data").Find(&categories).Error
	return categories, err
}

func (r *inventoryRepository) GetCategoryByID(id string) (*entity.InventoryCategory, error) {
	var category entity.InventoryCategory
	err := r.db.Preload("Data").Where("id = ?", id).First(&category).Error
	return &category, err
}

func (r *inventoryRepository) CreateData(data *entity.InventoryData) error {
	return r.db.Create(data).Error
}

func (r *inventoryRepository) UpdateData(data *entity.InventoryData) error {
	return r.db.Save(data).Error
}

func (r *inventoryRepository) DeleteData(id string) error {
	return r.db.Where("id = ?", id).Delete(&entity.InventoryData{}).Error
}

func (r *inventoryRepository) GetDataByCategory(categoryID string) ([]entity.InventoryData, error) {
	var data []entity.InventoryData
	err := r.db.Where("category_id = ?", categoryID).Find(&data).Error
	return data, err
}

func (r *inventoryRepository) GetDataByID(id string) (*entity.InventoryData, error) {
	var data entity.InventoryData
	err := r.db.Where("id = ?", id).First(&data).Error
	return &data, err
}

func (r *inventoryRepository) FindAllWithPagination(params response.QueryParams) ([]entity.InventoryData, int, error) {
	var inventoryData []entity.InventoryData

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildInventoryQuery(params)

	total, err := queryBuilder.Paginate(query, params, &inventoryData)
	if err != nil {
		return nil, 0, err
	}

	return inventoryData, total, nil
}
