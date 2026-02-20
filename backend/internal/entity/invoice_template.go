package entity

import "time"

type InvoiceTemplate struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(200);not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Layout      string    `gorm:"type:varchar(100)" json:"layout"`
	Options     string    `gorm:"type:json" json:"options"` // JSON string for extra config
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (InvoiceTemplate) TableName() string {
	return "invoice_templates"
}
