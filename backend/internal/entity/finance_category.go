package entity

type FinanceCategoryModel struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	UserID uint   `gorm:"not null;index;default:1" json:"user_id"`
	Name   string `gorm:"type:varchar(100)" json:"name"`
}
