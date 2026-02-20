package entity

import "time"

type Customer struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(200);not null;index" json:"name"`
	Phone     string    `gorm:"type:varchar(50)" json:"phone"`
	Email     string    `gorm:"type:varchar(200)" json:"email"`
	Address   string    `gorm:"type:text" json:"address"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Customer) TableName() string {
	return "customers"
}
