package entity

import "time"

// ProjectExpense represents a project expense entry
type ProjectExpense struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID int       `json:"projectId" gorm:"column:project_id;not null;index"`
	Tanggal   string    `json:"tanggal" gorm:"type:date;not null;index"`
	Kategori  string    `json:"kategori" gorm:"type:varchar(100);not null;index"`
	Deskripsi string    `json:"deskripsi" gorm:"type:text"`
	Jumlah    float64   `json:"jumlah" gorm:"type:decimal(15,2);not null;default:0"`
	Status    string    `json:"status" gorm:"type:enum('Paid','Unpaid','Pending');not null;default:'Unpaid';index"`
	FinanceID *int      `json:"financeId,omitempty" gorm:"column:finance_id;index"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for ProjectExpense
func (ProjectExpense) TableName() string {
	return "project_expenses"
}

// ProjectExpenseCreateRequest represents the request to create a project expense
type ProjectExpenseCreateRequest struct {
	ProjectID int     `json:"projectId" validate:"required"`
	Tanggal   string  `json:"tanggal" validate:"required"`
	Kategori  string  `json:"kategori" validate:"required"`
	Deskripsi string  `json:"deskripsi"`
	Jumlah    float64 `json:"jumlah" validate:"required,gt=0"`
	Status    string  `json:"status" validate:"required,oneof=Paid Unpaid Pending"`
}

// ProjectExpenseUpdateRequest represents the request to update a project expense
type ProjectExpenseUpdateRequest struct {
	Tanggal   string  `json:"tanggal"`
	Kategori  string  `json:"kategori"`
	Deskripsi string  `json:"deskripsi"`
	Jumlah    float64 `json:"jumlah"`
	Status    string  `json:"status" validate:"omitempty,oneof=Paid Unpaid Pending"`
}

// ProjectFinancialSummary represents financial analysis for a project
type ProjectFinancialSummary struct {
	ProjectID         int               `json:"projectId"`
	ProjectName       string            `json:"projectName"`
	TotalRevenue      float64           `json:"totalRevenue"`      // Total pemasukan kontrak
	TotalIncome       float64           `json:"totalIncome"`       // Total pemasukan yang sudah diterima
	IncomeReceived    float64           `json:"incomeReceived"`    // Pemasukan yang sudah received
	IncomePending     float64           `json:"incomePending"`     // Pemasukan yang pending
	TotalExpenses     float64           `json:"totalExpenses"`     // Total pengeluaran
	ExpensesPaid      float64           `json:"expensesPaid"`      // Pengeluaran yang sudah dibayar
	ExpensesUnpaid    float64           `json:"expensesUnpaid"`    // Pengeluaran yang belum dibayar
	ActualProfit      float64           `json:"actualProfit"`      // Profit aktual (income - expenses paid)
	EstimatedProfit   float64           `json:"estimatedProfit"`   // Keuntungan yang diperkirakan
	ProgressPercent   float64           `json:"progressPercent"`   // Persentase progress
	ProfitMargin      float64           `json:"profitMargin"`      // Profit margin (%)
	IncomeCategories  []IncomeCategory  `json:"incomeCategories"`  // Breakdown pemasukan per kategori
	ExpenseCategories []ExpenseCategory `json:"expenseCategories"` // Breakdown pengeluaran per kategori
}

// ExpenseCategory represents expense breakdown by category
type ExpenseCategory struct {
	Kategori string  `json:"kategori"`
	Total    float64 `json:"total"`
	Count    int     `json:"count"`
}
