package entity

type FinanceCategoryModel struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"type:varchar(100);uniqueIndex" json:"name"`
}
