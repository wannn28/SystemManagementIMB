// internal/entity/user.go
package entity

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:100" json:"name"`
	Email        string    `gorm:"size:100;uniqueIndex" json:"email"`
	Password     string    `gorm:"size:100" json:"-"`
	Role         string    `gorm:"size:20;default:'user'" json:"role"`
	Status       string    `gorm:"size:20;not null;default:'active'" json:"status"`
	CompanyName  string    `gorm:"size:200;default:''" json:"company_name"`
	CompanyLogo  string    `gorm:"size:500;default:''" json:"company_logo"`
	PrimaryColor string    `gorm:"size:20;default:'#f97316'" json:"primary_color"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}