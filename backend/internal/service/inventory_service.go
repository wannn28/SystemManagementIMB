package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

type InventoryService interface {
	CreateCategory(category *entity.InventoryCategory) error
	UpdateCategory(category *entity.InventoryCategory) error
	DeleteCategory(id string) error
	GetAllCategories() ([]entity.InventoryCategory, error)
	GetCategoryByID(id string) (*entity.InventoryCategory, error)

	CreateData(data *entity.InventoryData) error
	UpdateData(data *entity.InventoryData) error
	DeleteData(id string) error
	GetDataByCategory(categoryID string) ([]entity.InventoryData, error)
	GenerateDataID(categoryTitle, dataName string, index int) string

	GetDataByID(id string) (*entity.InventoryData, error)
}

type inventoryService struct {
	repo repository.InventoryRepository
}

func NewInventoryService(repo repository.InventoryRepository) InventoryService {
	return &inventoryService{repo}
}

func (s *inventoryService) CreateCategory(category *entity.InventoryCategory) error {
	category.ID = uuid.New().String()
	return s.repo.CreateCategory(category)
}

func (s *inventoryService) UpdateCategory(category *entity.InventoryCategory) error {
	return s.repo.UpdateCategory(category)
}

func (s *inventoryService) DeleteCategory(id string) error {
	return s.repo.DeleteCategory(id)
}

func (s *inventoryService) GetAllCategories() ([]entity.InventoryCategory, error) {
	return s.repo.GetAllCategories()
}

func (s *inventoryService) GetCategoryByID(id string) (*entity.InventoryCategory, error) {
	return s.repo.GetCategoryByID(id)
}

func (s *inventoryService) CreateData(data *entity.InventoryData) error {
	return s.repo.CreateData(data)
}

func (s *inventoryService) UpdateData(data *entity.InventoryData) error {
	return s.repo.UpdateData(data)
}

func (s *inventoryService) DeleteData(id string) error {
	return s.repo.DeleteData(id)
}

func (s *inventoryService) GetDataByCategory(categoryID string) ([]entity.InventoryData, error) {
	return s.repo.GetDataByCategory(categoryID)
}

func (s *inventoryService) GenerateDataID(categoryTitle, dataName string, index int) string {
	cleanCategory := strings.ToUpper(strings.ReplaceAll(categoryTitle, " ", "-"))
	cleanName := strings.ToUpper(strings.ReplaceAll(dataName, " ", "-"))
	return fmt.Sprintf("INV-%s-%s-%02d", cleanCategory, cleanName, index+1)
}

func (s *inventoryService) GetDataByID(id string) (*entity.InventoryData, error) {
	return s.repo.GetDataByID(id)
}
