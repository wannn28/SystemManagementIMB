package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"errors"
)

type ProjectIncomeService interface {
	CreateIncome(req *entity.ProjectIncomeCreateRequest) (*entity.ProjectIncome, error)
	UpdateIncome(id int, req *entity.ProjectIncomeUpdateRequest) (*entity.ProjectIncome, error)
	DeleteIncome(id int) error
	GetIncomeByID(id int) (*entity.ProjectIncome, error)
	GetIncomesByProjectID(projectID int) ([]entity.ProjectIncome, error)
	GetAllIncomes() ([]entity.ProjectIncome, error)
}

type projectIncomeService struct {
	repo repository.ProjectIncomeRepository
}

func NewProjectIncomeService(repo repository.ProjectIncomeRepository) ProjectIncomeService {
	return &projectIncomeService{repo}
}

func (s *projectIncomeService) CreateIncome(req *entity.ProjectIncomeCreateRequest) (*entity.ProjectIncome, error) {
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

	income := &entity.ProjectIncome{
		ProjectID: req.ProjectID,
		Tanggal:   req.Tanggal,
		Kategori:  req.Kategori,
		Deskripsi: req.Deskripsi,
		Jumlah:    req.Jumlah,
		Status:    req.Status,
	}

	if err := s.repo.Create(income); err != nil {
		return nil, err
	}

	return income, nil
}

func (s *projectIncomeService) UpdateIncome(id int, req *entity.ProjectIncomeUpdateRequest) (*entity.ProjectIncome, error) {
	income, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("income not found")
	}

	// Update only provided fields
	if req.Tanggal != "" {
		income.Tanggal = req.Tanggal
	}
	if req.Kategori != "" {
		income.Kategori = req.Kategori
	}
	if req.Deskripsi != "" {
		income.Deskripsi = req.Deskripsi
	}
	if req.Jumlah > 0 {
		income.Jumlah = req.Jumlah
	}
	if req.Status != "" {
		income.Status = req.Status
	}

	if err := s.repo.Update(income); err != nil {
		return nil, err
	}

	return income, nil
}

func (s *projectIncomeService) DeleteIncome(id int) error {
	_, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("income not found")
	}

	return s.repo.Delete(id)
}

func (s *projectIncomeService) GetIncomeByID(id int) (*entity.ProjectIncome, error) {
	return s.repo.FindByID(id)
}

func (s *projectIncomeService) GetIncomesByProjectID(projectID int) ([]entity.ProjectIncome, error) {
	return s.repo.FindByProjectID(projectID)
}

func (s *projectIncomeService) GetAllIncomes() ([]entity.ProjectIncome, error) {
	return s.repo.FindAll()
}

