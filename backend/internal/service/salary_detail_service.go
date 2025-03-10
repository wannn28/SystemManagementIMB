// internal/service/salary_detail_service.go
package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type SalaryDetailService interface {
	CreateDetail(detail *entity.SalaryDetail) error
	UpdateDetail(detail *entity.SalaryDetail) error
	DeleteDetail(id uint) error
	GetDetailByID(id uint) (*entity.SalaryDetail, error)
	GetDetailsBySalary(salaryID uint) ([]entity.SalaryDetail, error)
}

type salaryDetailService struct {
	repo repository.SalaryDetailRepository
}

func NewSalaryDetailService(repo repository.SalaryDetailRepository) SalaryDetailService {
	return &salaryDetailService{repo}
}

func (s *salaryDetailService) CreateDetail(detail *entity.SalaryDetail) error {
	return s.repo.Create(detail)
}

func (s *salaryDetailService) UpdateDetail(detail *entity.SalaryDetail) error {
	return s.repo.Update(detail)
}
func (s *salaryDetailService) DeleteDetail(id uint) error {
	return s.repo.Delete(id)
}
func (s *salaryDetailService) GetDetailsBySalary(salaryID uint) ([]entity.SalaryDetail, error) {
	return s.repo.FindBySalaryID(salaryID)
}
func (s *salaryDetailService) GetDetailByID(id uint) (*entity.SalaryDetail, error) {
	return s.repo.FindByID(id)
}

// type KasbonService interface {
// 	CreateDetailKasbon(detail *entity.Kasbon) error
// 	UpdateDetailKasbon(detail *entity.Kasbon) error
// 	DeleteDetailKasbon(id uint) error
// 	GetDetailsBySalaryKasbon(salaryID uint) ([]entity.Kasbon, error)
// }

// type kasbonService struct {
// 	repo repository.SalaryDetailRepository
// }

// func NewKasbonService(repo repository.SalaryDetailRepository) KasbonService {
// 	return &kasbonService{repo}
// }

// func (s *kasbonService) CreateDetailKasbon(detail *entity.Kasbon) error {
// 	return s.repo.CreateKasbon(detail)
// }

// func (s *kasbonService) UpdateDetailKasbon(detail *entity.Kasbon) error {
// 	return s.repo.UpdateKasbon(detail)
// }
// func (s *kasbonService) DeleteDetailKasbon(id uint) error {
// 	return s.repo.DeleteKasbon(id)
// }
// func (s *kasbonService) GetDetailsBySalaryKasbon(salaryID uint) ([]entity.Kasbon, error) {
// 	return s.repo.FindBySalaryIDKasbon(salaryID)
// }
