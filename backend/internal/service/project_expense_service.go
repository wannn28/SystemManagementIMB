package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"errors"
)

type ProjectExpenseService interface {
	CreateExpense(req *entity.ProjectExpenseCreateRequest) (*entity.ProjectExpense, error)
	UpdateExpense(id int, req *entity.ProjectExpenseUpdateRequest) (*entity.ProjectExpense, error)
	DeleteExpense(id int) error
	GetExpenseByID(id int) (*entity.ProjectExpense, error)
	GetExpensesByProjectID(projectID int) ([]entity.ProjectExpense, error)
	GetAllExpenses() ([]entity.ProjectExpense, error)
	GetFinancialSummary(projectID int) (*entity.ProjectFinancialSummary, error)
}

type projectExpenseService struct {
	repo       repository.ProjectExpenseRepository
	incomeRepo repository.ProjectIncomeRepository
}

func NewProjectExpenseService(repo repository.ProjectExpenseRepository, incomeRepo repository.ProjectIncomeRepository) ProjectExpenseService {
	return &projectExpenseService{repo, incomeRepo}
}

func (s *projectExpenseService) CreateExpense(req *entity.ProjectExpenseCreateRequest) (*entity.ProjectExpense, error) {
	if req.ProjectID <= 0 {
		return nil, errors.New("project ID is required")
	}
	if req.Jumlah <= 0 {
		return nil, errors.New("jumlah must be greater than 0")
	}
	if req.Tanggal == "" {
		return nil, errors.New("tanggal is required")
	}
	if req.Kategori == "" {
		return nil, errors.New("kategori is required")
	}

	expense := &entity.ProjectExpense{
		ProjectID: req.ProjectID,
		Tanggal:   req.Tanggal,
		Kategori:  req.Kategori,
		Deskripsi: req.Deskripsi,
		Jumlah:    req.Jumlah,
		Status:    req.Status,
	}

	if err := s.repo.Create(expense); err != nil {
		return nil, err
	}

	return expense, nil
}

func (s *projectExpenseService) UpdateExpense(id int, req *entity.ProjectExpenseUpdateRequest) (*entity.ProjectExpense, error) {
	expense, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("expense not found")
	}

	// Update only provided fields
	if req.Tanggal != "" {
		expense.Tanggal = req.Tanggal
	}
	if req.Kategori != "" {
		expense.Kategori = req.Kategori
	}
	if req.Deskripsi != "" {
		expense.Deskripsi = req.Deskripsi
	}
	if req.Jumlah > 0 {
		expense.Jumlah = req.Jumlah
	}
	if req.Status != "" {
		expense.Status = req.Status
	}

	if err := s.repo.Update(expense); err != nil {
		return nil, err
	}

	return expense, nil
}

func (s *projectExpenseService) DeleteExpense(id int) error {
	_, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("expense not found")
	}

	return s.repo.Delete(id)
}

func (s *projectExpenseService) GetExpenseByID(id int) (*entity.ProjectExpense, error) {
	return s.repo.FindByID(id)
}

func (s *projectExpenseService) GetExpensesByProjectID(projectID int) ([]entity.ProjectExpense, error) {
	return s.repo.FindByProjectID(projectID)
}

func (s *projectExpenseService) GetAllExpenses() ([]entity.ProjectExpense, error) {
	return s.repo.FindAll()
}

func (s *projectExpenseService) GetFinancialSummary(projectID int) (*entity.ProjectFinancialSummary, error) {
	return s.repo.GetFinancialSummary(projectID, s.incomeRepo)
}

