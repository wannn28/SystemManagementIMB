package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type SalaryService interface {
	CreateSalary(salary *entity.Salary) error
	UpdateSalary(salary *entity.Salary) error
	DeleteSalary(salaryID uint) error
	GetSalariesByMember(memberID string) ([]entity.Salary, error)
	GetSalaryByID(id uint) (*entity.Salary, error)
	RecalculateSalary(salaryID uint) error // Tambahkan method ini
}

type salaryService struct {
	salaryRepo    repository.SalaryRepository
	memberRepo    repository.MemberRepository
	detailService SalaryDetailService
	kasbonService KasbonService
}

func NewSalaryService(
	salaryRepo repository.SalaryRepository,
	memberRepo repository.MemberRepository,
	detailService SalaryDetailService,
	kasbonService KasbonService,
) SalaryService {
	return &salaryService{
		salaryRepo:    salaryRepo,
		memberRepo:    memberRepo,
		detailService: detailService,
		kasbonService: kasbonService,
	}
}

func (s *salaryService) CreateSalary(salary *entity.Salary) error {
	// Cek member exists
	_, err := s.memberRepo.FindByID(salary.MemberID)
	if err != nil {
		return err
	}
	return s.salaryRepo.Create(salary)
}

func (s *salaryService) UpdateSalary(salary *entity.Salary) error {
	return s.salaryRepo.Update(salary)
}

func (s *salaryService) DeleteSalary(salaryID uint) error {
	salary, err := s.salaryRepo.FindByID(salaryID)
	if err != nil {
		return err
	}
	return s.salaryRepo.Delete(salary)
}

func (s *salaryService) GetSalariesByMember(memberID string) ([]entity.Salary, error) {
	return s.salaryRepo.FindByMemberID(memberID)
}

func (s *salaryService) GetSalaryByID(id uint) (*entity.Salary, error) {
	return s.salaryRepo.FindByID(id)
}
func (s *salaryService) RecalculateSalary(salaryID uint) error {
	salary, err := s.salaryRepo.FindByID(salaryID)
	if err != nil {
		return err
	}

	// Hitung Gross dari SalaryDetail
	details, err := s.detailService.GetDetailsBySalary(salaryID)
	if err != nil {
		return err
	}
	gross := 0.0
	for _, d := range details {
		gross += float64(d.JamTrip) * d.HargaPerJam
	}

	// Hitung Loan dari Kasbon
	kasbons, err := s.kasbonService.GetKasbonsBySalary(salaryID)
	if err != nil {
		return err
	}
	loan := 0.0
	for _, k := range kasbons {
		loan += k.Jumlah
	}

	// Update nilai Salary
	salary.GrossSalary = gross
	salary.Loan = loan
	salary.NetSalary = gross - loan
	salary.Salary = gross
	return s.salaryRepo.Update(salary)
}
