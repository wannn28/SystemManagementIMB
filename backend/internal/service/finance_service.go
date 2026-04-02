package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
)

type FinanceService interface {
	CreateFinance(userID uint, finance *entity.Finance) error
	UpdateFinance(finance *entity.Finance) error
	DeleteFinance(id uint) error
	GetAllFinance(userID uint) ([]entity.Finance, error)
	GetAllFinanceWithPagination(params response.QueryParams, userID uint) ([]entity.Finance, int, error)
	GetFinanceByID(id uint) (*entity.Finance, error)
	GetFinanceByType(userID uint, fType entity.FinanceType) ([]entity.Finance, error)
	GetFinancialSummary(userID uint) (income float64, expense float64, err error)
	GetMonthlyComparison(userID uint) ([]entity.MonthlyComparison, error)
	GetFinanceByDateRange(userID uint, startDate, endDate string) ([]entity.Finance, error)
	GetFinanceByAmountRange(userID uint, minAmount, maxAmount float64) ([]entity.Finance, error)
	GetFinanceByCategory(userID uint, category entity.FinanceCategory) ([]entity.Finance, error)
	GetFinanceByStatus(userID uint, status string) ([]entity.Finance, error)
}

type financeService struct {
	repo repository.FinanceRepository
}

func NewFinanceService(repo repository.FinanceRepository) FinanceService {
	return &financeService{repo}
}

func (s *financeService) CreateFinance(userID uint, finance *entity.Finance) error {
	finance.UserID = userID
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

func (s *financeService) GetAllFinance(userID uint) ([]entity.Finance, error) {
	return s.repo.FindAll(userID)
}

func (s *financeService) GetFinanceByID(id uint) (*entity.Finance, error) {
	return s.repo.FindByID(id)
}

func (s *financeService) GetFinanceByType(userID uint, fType entity.FinanceType) ([]entity.Finance, error) {
	return s.repo.FindByType(userID, fType)
}

func (s *financeService) GetFinancialSummary(userID uint) (income float64, expense float64, err error) {
	return s.repo.GetFinancialSummary(userID)
}

func (s *financeService) GetMonthlyComparison(userID uint) ([]entity.MonthlyComparison, error) {
	return s.repo.GetMonthlyComparison(userID)
}

func (s *financeService) GetAllFinanceWithPagination(params response.QueryParams, userID uint) ([]entity.Finance, int, error) {
	return s.repo.FindAllWithPagination(params, userID)
}

func (s *financeService) GetFinanceByDateRange(userID uint, startDate, endDate string) ([]entity.Finance, error) {
	return s.repo.GetFinanceByDateRange(userID, startDate, endDate)
}

func (s *financeService) GetFinanceByAmountRange(userID uint, minAmount, maxAmount float64) ([]entity.Finance, error) {
	return s.repo.GetFinanceByAmountRange(userID, minAmount, maxAmount)
}

func (s *financeService) GetFinanceByCategory(userID uint, category entity.FinanceCategory) ([]entity.Finance, error) {
	return s.repo.GetFinanceByCategory(userID, category)
}

func (s *financeService) GetFinanceByStatus(userID uint, status string) ([]entity.Finance, error) {
	return s.repo.GetFinanceByStatus(userID, status)
}
