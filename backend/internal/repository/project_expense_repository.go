package repository

import (
	"dashboardadminimb/internal/entity"
	"errors"

	"gorm.io/gorm"
)

type ProjectExpenseRepository interface {
	Create(expense *entity.ProjectExpense) error
	Update(expense *entity.ProjectExpense) error
	Delete(id int) error
	FindByID(id int) (*entity.ProjectExpense, error)
	FindByProjectID(projectID int) ([]entity.ProjectExpense, error)
	FindAll() ([]entity.ProjectExpense, error)
	GetFinancialSummary(projectID int, incomeRepo ProjectIncomeRepository) (*entity.ProjectFinancialSummary, error)
}

type projectExpenseRepository struct {
	db *gorm.DB
}

func NewProjectExpenseRepository(db *gorm.DB) ProjectExpenseRepository {
	return &projectExpenseRepository{db}
}

func (r *projectExpenseRepository) Create(expense *entity.ProjectExpense) error {
	return r.db.Create(expense).Error
}

func (r *projectExpenseRepository) Update(expense *entity.ProjectExpense) error {
	return r.db.Save(expense).Error
}

func (r *projectExpenseRepository) Delete(id int) error {
	return r.db.Delete(&entity.ProjectExpense{}, id).Error
}

func (r *projectExpenseRepository) FindByID(id int) (*entity.ProjectExpense, error) {
	var expense entity.ProjectExpense
	if err := r.db.First(&expense, id).Error; err != nil {
		return nil, err
	}
	return &expense, nil
}

func (r *projectExpenseRepository) FindByProjectID(projectID int) ([]entity.ProjectExpense, error) {
	var expenses []entity.ProjectExpense
	if err := r.db.Where("project_id = ?", projectID).
		Order("tanggal DESC").
		Find(&expenses).Error; err != nil {
		return nil, err
	}
	return expenses, nil
}

func (r *projectExpenseRepository) FindAll() ([]entity.ProjectExpense, error) {
	var expenses []entity.ProjectExpense
	if err := r.db.Order("tanggal DESC").Find(&expenses).Error; err != nil {
		return nil, err
	}
	return expenses, nil
}

func (r *projectExpenseRepository) GetFinancialSummary(projectID int, incomeRepo ProjectIncomeRepository) (*entity.ProjectFinancialSummary, error) {
	// Get project details
	var project entity.Project
	if err := r.db.First(&project, projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	// Get all incomes for this project
	var incomes []entity.ProjectIncome
	if err := r.db.Where("project_id = ?", projectID).Find(&incomes).Error; err != nil {
		return nil, err
	}

	// Calculate income totals
	var totalIncome float64
	var incomeReceived float64
	var incomePending float64
	incomeCategoryMap := make(map[string]*entity.IncomeCategory)

	for _, income := range incomes {
		totalIncome += income.Jumlah

		if income.Status == "Received" {
			incomeReceived += income.Jumlah
		} else {
			incomePending += income.Jumlah
		}

		// Group by category
		if cat, exists := incomeCategoryMap[income.Kategori]; exists {
			cat.Total += income.Jumlah
			cat.Count++
		} else {
			incomeCategoryMap[income.Kategori] = &entity.IncomeCategory{
				Kategori: income.Kategori,
				Total:    income.Jumlah,
				Count:    1,
			}
		}
	}

	// Convert income category map to slice
	var incomeCategories []entity.IncomeCategory
	for _, cat := range incomeCategoryMap {
		incomeCategories = append(incomeCategories, *cat)
	}

	// Get all expenses for this project
	var expenses []entity.ProjectExpense
	if err := r.db.Where("project_id = ?", projectID).Find(&expenses).Error; err != nil {
		return nil, err
	}

	// Calculate expense totals
	var totalExpenses float64
	var expensesPaid float64
	var expensesUnpaid float64
	expenseCategoryMap := make(map[string]*entity.ExpenseCategory)

	for _, expense := range expenses {
		totalExpenses += expense.Jumlah

		if expense.Status == "Paid" {
			expensesPaid += expense.Jumlah
		} else {
			expensesUnpaid += expense.Jumlah
		}

		// Group by category
		if cat, exists := expenseCategoryMap[expense.Kategori]; exists {
			cat.Total += expense.Jumlah
			cat.Count++
		} else {
			expenseCategoryMap[expense.Kategori] = &entity.ExpenseCategory{
				Kategori: expense.Kategori,
				Total:    expense.Jumlah,
				Count:    1,
			}
		}
	}

	// Convert expense category map to slice
	var expenseCategories []entity.ExpenseCategory
	for _, cat := range expenseCategoryMap {
		expenseCategories = append(expenseCategories, *cat)
	}

	// Calculate financial metrics
	totalRevenue := project.TotalRevenue // Total revenue kontrak
	actualProfit := incomeReceived - expensesPaid // Profit aktual (yang sudah received - paid)
	estimatedProfit := totalIncome - totalExpenses // Profit estimasi (semua income - semua expense)
	profitMargin := 0.0
	if totalRevenue > 0 {
		profitMargin = (estimatedProfit / totalRevenue) * 100
	}

	// Calculate progress percentage (income received vs total revenue)
	progressPercent := 0.0
	if totalRevenue > 0 && incomeReceived > 0 {
		progressPercent = (incomeReceived / totalRevenue) * 100
	}

	return &entity.ProjectFinancialSummary{
		ProjectID:         projectID,
		ProjectName:       project.Name,
		TotalRevenue:      totalRevenue,
		TotalIncome:       totalIncome,
		IncomeReceived:    incomeReceived,
		IncomePending:     incomePending,
		TotalExpenses:     totalExpenses,
		ExpensesPaid:      expensesPaid,
		ExpensesUnpaid:    expensesUnpaid,
		ActualProfit:      actualProfit,
		EstimatedProfit:   estimatedProfit,
		ProgressPercent:   progressPercent,
		ProfitMargin:      profitMargin,
		IncomeCategories:  incomeCategories,
		ExpenseCategories: expenseCategories,
	}, nil
}
