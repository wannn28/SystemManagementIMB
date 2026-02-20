package entity

import "time"

type Equipment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"type:varchar(200);not null;index" json:"name"`
	Type      string    `gorm:"type:varchar(20);not null;default:alat_berat" json:"type"` // alat_berat | dump_truck
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Equipment) TableName() string {
	return "equipment"
}
