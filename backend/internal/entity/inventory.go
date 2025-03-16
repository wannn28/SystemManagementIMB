package entity

import (
	"gorm.io/datatypes"
)

type InventoryCategory struct {
	ID          string          `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Title       string          `gorm:"size:255" json:"title"`
	Description string          `gorm:"type:text" json:"description"`
	Headers     datatypes.JSON  `gorm:"type:json" json:"headers"`
	Data        []InventoryData `gorm:"foreignKey:CategoryID" json:"data"`
}

type InventoryData struct {
	ID         string         `gorm:"primaryKey;type:varchar(255)" json:"id"`
	CategoryID string         `gorm:"type:varchar(36);index" json:"category_id"`
	Values     datatypes.JSON `gorm:"type:json" json:"values"`
	Images     datatypes.JSON `gorm:"type:json" json:"images"`
}
