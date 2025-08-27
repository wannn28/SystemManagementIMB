package entity

type FinanceType string
type FinanceCategory string // Tambahkan tipe kategori

const (
	Income  FinanceType = "income"
	Expense FinanceType = "expense"
)

const (
	CategoryBarang        FinanceCategory = "Barang"
	CategoryJasa          FinanceCategory = "Jasa"
	CategorySewaAlatBerat FinanceCategory = "Sewa Alat Berat"
	CategoryOther         FinanceCategory = "Other"
)

type MonthlyComparison struct {
	Month   string  `json:"month"`
	Income  float64 `json:"income"`
	Expense float64 `json:"expense"`
}
type Finance struct {
	ID           uint            `gorm:"primaryKey" json:"id"`
	Tanggal      string          `json:"tanggal"`
	Unit         int             `json:"unit"`
	Jumlah       float64         `json:"jumlah"`
	HargaPerUnit float64         `json:"hargaPerUnit"`
	Keterangan   string          `json:"keterangan"`
	Type         FinanceType     `gorm:"type:ENUM('income','expense')" json:"type"`
	Category     FinanceCategory `gorm:"type:varchar(100)" json:"category"`
	Status       string          `gorm:"type:ENUM('Paid','Unpaid')" json:"status"`
}
