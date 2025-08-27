package entity

import (
	"gorm.io/datatypes"
)

type ReportDaily struct {
	ID           uint    `gorm:"primaryKey" json:"id"`
	ProjectID    uint    `gorm:"index" json:"projectId"`
	Date         string  `json:"date"`
	Revenue      float64 `json:"revenue"`
	Paid         float64 `json:"paid"`
	Volume       float64 `json:"volume"`
	TargetVolume float64 `json:"targetVolume"`
	Plan         float64 `json:"plan"`
	Aktual       float64 `json:"aktual"`
	// New fields for workers and equipment as JSON
	Workers        datatypes.JSON `json:"workers"`   // JSON object with worker types and counts
	Equipment      datatypes.JSON `json:"equipment"` // JSON object with equipment types and counts
	TotalWorkers   int            `json:"totalWorkers"`
	TotalEquipment int            `json:"totalEquipment"`
	// Images will be stored in separate table
	Images    []DailyReportImage `gorm:"foreignKey:ReportDailyID" json:"images"`
	CreatedAt int64              `json:"createdAt"`
	UpdatedAt int64              `json:"updatedAt"`
}

// New table for storing daily report images
type DailyReportImage struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	ReportDailyID uint   `gorm:"index" json:"reportDailyId"`
	ImagePath     string `json:"imagePath"`
	Description   string `json:"description"`
	CreatedAt     int64  `json:"createdAt"`
	UpdatedAt     int64  `json:"updatedAt"`
}

type ReportWeekly struct {
	Week         string  `json:"week"`
	TargetPlan   float64 `json:"targetPlan"`
	TargetAktual float64 `json:"targetAktual"`
	Volume       float64 `json:"volume"`
	TargetVolume float64 `json:"targetVolume"`
}

type ReportMonthly struct {
	Month        string  `json:"month"`
	TargetPlan   float64 `json:"targetPlan"`
	TargetAktual float64 `json:"targetAktual"`
	Volume       float64 `json:"volume"`
	TargetVolume float64 `json:"targetVolume"`
}

type Project struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"size:255" json:"name"`
	Description  string         `gorm:"type:text" json:"description"`
	Status       string         `gorm:"size:50" json:"status"`
	StartDate    string         `json:"startDate"`
	EndDate      string         `json:"endDate"`
	MaxDuration  string         `gorm:"size:50" json:"maxDuration"`
	TotalRevenue float64        `json:"totalRevenue"`
	AmountPaid   float64        `json:"amountPaid"`
	UnitPrice    float64        `json:"unitPrice"`
	TotalVolume  float64        `json:"totalVolume"`
	Unit         string         `gorm:"size:50" json:"unit"`
	Reports      datatypes.JSON `gorm:"type:jsonb" json:"reports"`
}
