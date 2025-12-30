package entity

import "time"

// ProjectIncome represents a project income entry
type ProjectIncome struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ProjectID int       `json:"projectId" gorm:"column:project_id;not null;index"`
	Tanggal   string    `json:"tanggal" gorm:"type:date;not null;index"`
	Kategori  string    `json:"kategori" gorm:"type:varchar(100);not null;index"`
	Deskripsi string    `json:"deskripsi" gorm:"type:text"`
	Jumlah    float64   `json:"jumlah" gorm:"type:decimal(15,2);not null;default:0"`
	Status    string    `json:"status" gorm:"type:enum('Received','Pending','Planned');not null;default:'Pending';index"`
	FinanceID *int      `json:"financeId,omitempty" gorm:"column:finance_id;index"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName specifies the table name for ProjectIncome
func (ProjectIncome) TableName() string {
	return "project_incomes"
}

// ProjectIncomeCreateRequest represents the request to create a project income
type ProjectIncomeCreateRequest struct {
	ProjectID int     `json:"projectId" validate:"required"`
	Tanggal   string  `json:"tanggal" validate:"required"`
	Kategori  string  `json:"kategori" validate:"required"`
	Deskripsi string  `json:"deskripsi"`
	Jumlah    float64 `json:"jumlah" validate:"required,gt=0"`
	Status    string  `json:"status" validate:"required,oneof=Received Pending Planned"`
}

// ProjectIncomeUpdateRequest represents the request to update a project income
type ProjectIncomeUpdateRequest struct {
	Tanggal   string  `json:"tanggal"`
	Kategori  string  `json:"kategori"`
	Deskripsi string  `json:"deskripsi"`
	Jumlah    float64 `json:"jumlah"`
	Status    string  `json:"status" validate:"omitempty,oneof=Received Pending Planned"`
}

// IncomeCategory represents income breakdown by category
type IncomeCategory struct {
	Kategori string  `json:"kategori"`
	Total    float64 `json:"total"`
	Count    int     `json:"count"`
}

