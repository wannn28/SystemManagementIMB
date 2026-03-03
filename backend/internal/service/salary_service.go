package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
)

type SalaryService interface {
	CreateSalary(salary *entity.Salary) error
	UpdateSalary(salary *entity.Salary) error
	DeleteSalary(salaryID uint) error
	DeleteAllByMemberID(memberID string) error
	GetSalariesByMember(memberID string) ([]entity.Salary, error)
	GetAllSalariesWithPagination(params response.QueryParams) ([]entity.Salary, int, error)
	GetSalaryByID(id uint) (*entity.Salary, error)
	RecalculateSalary(salaryID uint) error
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

// DeleteAllByMemberID deletes all salaries and related kasbons/details for a member (for cascade delete before member delete).
func (s *salaryService) DeleteAllByMemberID(memberID string) error {
	salaries, err := s.salaryRepo.FindByMemberID(memberID)
	if err != nil {
		return err
	}
	for _, sal := range salaries {
		kasbons, _ := s.kasbonService.GetKasbonsBySalary(sal.ID)
		for _, k := range kasbons {
			_ = s.kasbonService.DeleteKasbon(k.ID)
		}
		details, _ := s.detailService.GetDetailsBySalary(sal.ID)
		for _, d := range details {
			_ = s.detailService.DeleteDetail(d.ID)
		}
		if err := s.salaryRepo.Delete(&sal); err != nil {
			return err
		}
	}
	return nil
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

func (s *salaryService) GetAllSalariesWithPagination(params response.QueryParams) ([]entity.Salary, int, error) {
	return s.salaryRepo.FindAllWithPagination(params)
}
