package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type KasbonService interface {
	CreateKasbon(kasbon *entity.Kasbon) error
	UpdateKasbon(kasbon *entity.Kasbon) error
	DeleteKasbon(id uint) error
	GetKasbonByID(id uint) (*entity.Kasbon, error)
	GetKasbonsBySalary(salaryID uint) ([]entity.Kasbon, error)
}

type kasbonService struct {
	repo repository.KasbonRepository
}

func NewKasbonService(repo repository.KasbonRepository) KasbonService {
	return &kasbonService{repo}
}

func (s *kasbonService) CreateKasbon(kasbon *entity.Kasbon) error {
	return s.repo.Create(kasbon)
}

func (s *kasbonService) UpdateKasbon(kasbon *entity.Kasbon) error {
	return s.repo.Update(kasbon)
}

func (s *kasbonService) DeleteKasbon(id uint) error {
	return s.repo.Delete(id)
}

func (s *kasbonService) GetKasbonsBySalary(salaryID uint) ([]entity.Kasbon, error) {
	return s.repo.FindBySalaryID(salaryID)
}
func (s *kasbonService) GetKasbonByID(id uint) (*entity.Kasbon, error) {
	return s.repo.FindByID(id)
}
