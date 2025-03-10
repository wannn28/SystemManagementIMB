// internal/entity/member.go
package entity

import (
	"gorm.io/datatypes"
)

type Document struct {
	Name        string   `json:"name"`
	Urls        []string `json:"urls" gorm:"-"` // Menyimpan URL lebih dari satu
	HasDocument bool     `json:"hasDocument"`
}

// type SalaryRecord struct {
// 	Month       string   `json:"month"`
// 	Salary      float64  `json:"salary"`
// 	Loan        float64  `json:"loan"`
// 	NetSalary   float64  `json:"netSalary"`
// 	GrossSalary float64  `json:"grossSalary"`
// 	Status      string   `json:"status"`
// 	Documents   []string `json:"documents" gorm:"-"`
// }

// Hapus struct Document dan modifikasi field Files & Documents
type Member struct {
	ID           string         `gorm:"primaryKey;type:varchar(255)" json:"id"`
	FullName     string         `gorm:"size:255" json:"fullName"`
	Role         string         `gorm:"size:100" json:"role"`
	PhoneNumber  string         `gorm:"size:50" json:"phoneNumber"`
	Address      string         `gorm:"type:text" json:"address"`
	JoinDate     string         `json:"joinDate"`
	ProfileImage string         `json:"profileImage"`                // Hanya menyimpan nama file
	Documents    datatypes.JSON `gorm:"type:jsonb" json:"documents"` // Menyimpan array string
	Files        datatypes.JSON `gorm:"type:jsonb" json:"files"`     // Menyimpan array string
	Salaries     []Salary       `gorm:"foreignKey:MemberID" json:"salaries"`
}
