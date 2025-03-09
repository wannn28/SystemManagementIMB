package entity

import (
	"gorm.io/datatypes"
)

type ReportDaily struct {
	Date         string  `json:"date"`
	Revenue      float64 `json:"revenue"`
	Paid         float64 `json:"paid"`
	Volume       float64 `json:"volume"`
	TargetVolume float64 `json:"targetVolume"`
	Plan         float64 `json:"plan"`
	Aktual       float64 `json:"aktual"`
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
