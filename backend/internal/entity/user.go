// internal/entity/user.go
package entity

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:100" json:"name"`
	Email     string    `gorm:"size:100;uniqueIndex" json:"email"`
	Password  string    `gorm:"size:255" json:"-"`
	Role      string    `gorm:"size:50;default:'user'" json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
