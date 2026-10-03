package entity

import (
	"time"
)

// Salary quantity units for payroll line items.
const (
	SalaryUnitJam  = "Jam"
	SalaryUnitTrip = "Trip"
	SalaryUnitHari = "Hari"
)

type SalaryDetail struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	SalaryID    uint      `json:"salary_id"`
	Tanggal     time.Time `json:"tanggal" time_format:"2006-01-02"`
	JamTrip     float32   `json:"jam_trip"`      // Quantity (hours, trips, or days)
	HargaPerJam float64   `json:"harga_per_jam"` // Rate for the selected unit
	Unit        string    `gorm:"size:10;default:Jam" json:"unit"` // Jam | Trip | Hari
	Keterangan  string    `json:"keterangan"`
}

// NormalizeUnit returns a valid unit, defaulting legacy/empty rows to Jam (hours).
func (d *SalaryDetail) NormalizeUnit() string {
	switch d.Unit {
	case SalaryUnitTrip, SalaryUnitHari, SalaryUnitJam:
		return d.Unit
	case "trip", "TRIP":
		return SalaryUnitTrip
	case "hari", "HARI", "day", "Day":
		return SalaryUnitHari
	case "jam", "JAM", "hour", "Hour", "hours":
		return SalaryUnitJam
	default:
		return SalaryUnitJam
	}
}

type Kasbon struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SalaryID   uint      `json:"salary_id"`
	Tanggal    time.Time `json:"tanggal" time_format:"2006-01-02"`
	Jumlah     float64   `json:"jumlah"`
	Keterangan string    `json:"keterangan"`
}
