package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type EquipmentService interface {
	Create(userID uint, e *entity.Equipment) error
	Update(e *entity.Equipment) error
	Delete(id uint) error
	GetAll(userID uint, search string, typ string) ([]entity.EquipmentWithFinanceTotals, error)
	GetByID(id uint) (*entity.Equipment, error)
}

type equipmentService struct {
	repo        repository.EquipmentRepository
	financeRepo repository.FinanceRepository
}

func NewEquipmentService(repo repository.EquipmentRepository, financeRepo repository.FinanceRepository) EquipmentService {
	return &equipmentService{repo: repo, financeRepo: financeRepo}
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

func (s *equipmentService) GetAll(userID uint, search string, typ string) ([]entity.EquipmentWithFinanceTotals, error) {
	list, err := s.repo.FindAll(userID, search, typ)
	if err != nil {
		return nil, err
	}
	sums, err := s.financeRepo.SumLifetimeFinanceByEquipment(userID)
	if err != nil {
		return nil, err
	}
	totals := make(map[uint]struct{ income, expense float64 })
	for _, row := range sums {
		totals[row.EquipmentID] = struct{ income, expense float64 }{row.Income, row.Expense}
	}
	out := make([]entity.EquipmentWithFinanceTotals, len(list))
	for i, e := range list {
		t := totals[e.ID]
		out[i] = entity.EquipmentWithFinanceTotals{
			Equipment:    e,
			TotalIncome:  t.income,
			TotalExpense: t.expense,
		}
	}
	return out, nil
}

func (s *equipmentService) GetByID(id uint) (*entity.Equipment, error) {
	return s.repo.FindByID(id)
}
