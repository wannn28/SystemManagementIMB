package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type EquipmentService interface {
	Create(userID uint, e *entity.Equipment) error
	Update(e *entity.Equipment) error
	Delete(id uint) error
	GetAll(userID uint, search string, typ string) ([]entity.Equipment, error)
	GetByID(id uint) (*entity.Equipment, error)
}

type equipmentService struct {
	repo repository.EquipmentRepository
}

func NewEquipmentService(repo repository.EquipmentRepository) EquipmentService {
	return &equipmentService{repo: repo}
}

func (s *equipmentService) Create(userID uint, e *entity.Equipment) error {
	e.UserID = userID
	return s.repo.Create(e)
}

func (s *equipmentService) Update(e *entity.Equipment) error {
	return s.repo.Update(e)
}

func (s *equipmentService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *equipmentService) GetAll(userID uint, search string, typ string) ([]entity.Equipment, error) {
	return s.repo.FindAll(userID, search, typ)
}

func (s *equipmentService) GetByID(id uint) (*entity.Equipment, error) {
	return s.repo.FindByID(id)
}
