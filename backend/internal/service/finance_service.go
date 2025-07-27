package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
)

type FinanceService interface {
	CreateFinance(finance *entity.Finance) error
	UpdateFinance(finance *entity.Finance) error
	DeleteFinance(id uint) error
	GetAllFinance() ([]entity.Finance, error)
	GetAllFinanceWithPagination(params response.QueryParams) ([]entity.Finance, int, error)
	GetFinanceByID(id uint) (*entity.Finance, error)
	GetFinanceByType(fType entity.FinanceType) ([]entity.Finance, error)
	GetFinancialSummary() (income float64, expense float64, err error)
	GetMonthlyComparison() ([]entity.MonthlyComparison, error)
}

type financeService struct {
	repo repository.FinanceRepository
}

func (s *financeService) GetMonthlyComparison() ([]entity.MonthlyComparison, error) {
	return s.repo.GetMonthlyComparison()
}

func NewFinanceService(repo repository.FinanceRepository) FinanceService {
	return &financeService{repo}
}

func (s *financeService) CreateFinance(finance *entity.Finance) error {
	finance.Jumlah = finance.HargaPerUnit * float64(finance.Unit)
	return s.repo.Create(finance)
}

func (s *financeService) UpdateFinance(finance *entity.Finance) error {
	finance.Jumlah = finance.HargaPerUnit * float64(finance.Unit)
	return s.repo.Update(finance)
}

func (s *financeService) DeleteFinance(id uint) error {
	return s.repo.Delete(id)
}

func (s *financeService) GetAllFinance() ([]entity.Finance, error) {
	return s.repo.FindAll()
}

func (s *financeService) GetFinanceByID(id uint) (*entity.Finance, error) {
	return s.repo.FindByID(id)
}

func (s *financeService) GetFinanceByType(fType entity.FinanceType) ([]entity.Finance, error) {
	return s.repo.FindByType(fType)
}

func (s *financeService) GetFinancialSummary() (income float64, expense float64, err error) {
	return s.repo.GetFinancialSummary()
}

func (s *financeService) GetAllFinanceWithPagination(params response.QueryParams) ([]entity.Finance, int, error) {
	return s.repo.FindAllWithPagination(params)
}
