package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type FinanceCategoryService interface {
	Create(userID uint, name string) (*entity.FinanceCategoryModel, error)
	Update(id uint, name string) (*entity.FinanceCategoryModel, error)
	Delete(id uint) error
	List(userID uint) ([]entity.FinanceCategoryModel, error)
}

type financeCategoryService struct {
	repo repository.FinanceCategoryRepository
}

func NewFinanceCategoryService(repo repository.FinanceCategoryRepository) FinanceCategoryService {
	return &financeCategoryService{repo}
}

func (s *financeCategoryService) Create(userID uint, name string) (*entity.FinanceCategoryModel, error) {
	item := &entity.FinanceCategoryModel{UserID: userID, Name: name}
	return item, s.repo.Create(item)
}

func (s *financeCategoryService) Update(id uint, name string) (*entity.FinanceCategoryModel, error) {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	item.Name = name
	return item, s.repo.Update(item)
}

func (s *financeCategoryService) Delete(id uint) error { return s.repo.Delete(id) }

func (s *financeCategoryService) List(userID uint) ([]entity.FinanceCategoryModel, error) {
	return s.repo.FindAll(userID)
}
