// internal/entity/salary_detail.go
package entity

import (
	"time"
)

type SalaryDetail struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	SalaryID    uint      `json:"salary_id"`
	Tanggal     time.Time `json:"tanggal" time_format:"2006-01-02"`
	JamTrip     int       `json:"jam_trip"`      // Pastikan tag json benar
	HargaPerJam float64   `json:"harga_per_jam"` // Pastikan tag json benar
	Keterangan  string    `json:"keterangan"`
}

type Kasbon struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	SalaryID   uint      `json:"salary_id"`
	Tanggal    time.Time `json:"tanggal" time_format:"2006-01-02"`
	Jumlah     float64   `json:"jumlah"`
	Keterangan string    `json:"keterangan"`
}
