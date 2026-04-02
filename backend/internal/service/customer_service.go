package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type CustomerService interface {
	Create(userID uint, c *entity.Customer) error
	Update(c *entity.Customer) error
	Delete(id uint) error
	GetAll(userID uint, search string) ([]entity.Customer, error)
	GetByID(id uint) (*entity.Customer, error)
}

type customerService struct {
	repo repository.CustomerRepository
}

func NewCustomerService(repo repository.CustomerRepository) CustomerService {
	return &customerService{repo: repo}
}

func (s *customerService) Create(userID uint, c *entity.Customer) error {
	c.UserID = userID
	return s.repo.Create(c)
}

func (s *customerService) Update(c *entity.Customer) error {
	return s.repo.Update(c)
}

func (s *customerService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *customerService) GetAll(userID uint, search string) ([]entity.Customer, error) {
	return s.repo.FindAll(userID, search)
}

func (s *customerService) GetByID(id uint) (*entity.Customer, error) {
	return s.repo.FindByID(id)
}
