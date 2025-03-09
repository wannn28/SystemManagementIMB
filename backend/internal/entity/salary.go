// internal/entity/salary.go
package entity

import (
	"time"

	"gorm.io/datatypes"
)

type Salary struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	MemberID    string         `gorm:"type:varchar(255);index" json:"member_id"`
	Month       string         `gorm:"size(7)" json:"month"` // Format: YYYY-MM
	Salary      float64        `json:"salary"`
	Loan        float64        `json:"loan"`
	NetSalary   float64        `json:"net_salary"`
	GrossSalary float64        `json:"gross_salary"`
	Status      string         `gorm:"size(20)" json:"status"`
	Documents   datatypes.JSON `gorm:"type:json" json:"documents"` // Menyimpan array nama file
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	Member      Member         `gorm:"foreignKey:MemberID" json:"-"`
}
