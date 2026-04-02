package entity

import "time"

type ItemTemplate struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index;default:1" json:"user_id"`
	Name      string    `gorm:"type:varchar(200);not null;index" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (ItemTemplate) TableName() string {
	return "item_templates"
}
