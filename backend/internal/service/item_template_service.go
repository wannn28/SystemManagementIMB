package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type ItemTemplateService interface {
	Create(userID uint, e *entity.ItemTemplate) error
	Update(e *entity.ItemTemplate) error
	Delete(id uint) error
	GetAll(userID uint, search string) ([]entity.ItemTemplate, error)
	GetByID(id uint) (*entity.ItemTemplate, error)
}

type itemTemplateService struct {
	repo repository.ItemTemplateRepository
}

func NewItemTemplateService(repo repository.ItemTemplateRepository) ItemTemplateService {
	return &itemTemplateService{repo: repo}
}

func (s *itemTemplateService) Create(userID uint, e *entity.ItemTemplate) error {
	e.UserID = userID
	return s.repo.Create(e)
}

func (s *itemTemplateService) Update(e *entity.ItemTemplate) error {
	return s.repo.Update(e)
}

func (s *itemTemplateService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *itemTemplateService) GetAll(userID uint, search string) ([]entity.ItemTemplate, error) {
	return s.repo.FindAll(userID, search)
}

func (s *itemTemplateService) GetByID(id uint) (*entity.ItemTemplate, error) {
	return s.repo.FindByID(id)
}
