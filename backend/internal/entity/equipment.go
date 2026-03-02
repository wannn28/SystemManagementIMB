package entity

import "time"

type Equipment struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"type:varchar(200);not null;index" json:"name"`
	Type         string    `gorm:"type:varchar(20);not null;default:alat_berat" json:"type"`   // alat_berat | dump_truck
	LicensePlate string    `gorm:"type:varchar(30)" json:"license_plate"`                      // Plat nomor (untuk dump_truck); dipakai di kolom Keterangan
	PricePerDay  float64   `gorm:"type:decimal(15,2);default:0" json:"price_per_day"`         // Harga default per hari
	PricePerHour float64   `gorm:"type:decimal(15,2);default:0" json:"price_per_hour"`        // Harga default per jam (bisa diedit per baris di invoice)
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Equipment) TableName() string {
	return "equipment"
}
