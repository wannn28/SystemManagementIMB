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
	ID               uint            `gorm:"primaryKey" json:"id"`
	UserID           uint            `gorm:"not null;index;default:1" json:"user_id"`
	Tanggal          string          `json:"tanggal"`
	Unit             int             `json:"unit"`
	Jumlah           float64         `json:"jumlah"`
	HargaPerUnit     float64         `json:"hargaPerUnit"`
	Keterangan       string          `json:"keterangan"`
	Type             FinanceType     `gorm:"type:ENUM('income','expense')" json:"type"`
	Category         FinanceCategory `gorm:"type:varchar(100)" json:"category"`
	Status           string          `gorm:"type:varchar(20);default:'Unpaid'" json:"status"`
	TaxPaid          bool            `gorm:"column:tax_paid;default:false" json:"taxPaid"`
	ProjectID        *int            `json:"projectId,omitempty" gorm:"column:project_id"`
	Source           string          `json:"source" gorm:"type:varchar(50);default:'manual'"`
	ProjectIncomeID  *int            `json:"projectIncomeId,omitempty" gorm:"column:project_income_id"`
	ProjectExpenseID *int            `json:"projectExpenseId,omitempty" gorm:"column:project_expense_id"`
	EquipmentID      *uint           `json:"equipmentId,omitempty" gorm:"column:equipment_id;index"`
	// Detail fields
	NoBukti          string  `gorm:"column:no_bukti;type:varchar(100)" json:"noBukti"`
	VendorName       string  `gorm:"column:vendor_name;type:varchar(200)" json:"vendorName"`
	PaymentMethod    string  `gorm:"column:payment_method;type:varchar(50)" json:"paymentMethod"`
	KategoriUtama    string  `gorm:"column:kategori_utama;type:varchar(50)" json:"kategoriUtama"`
	JenisPajak       string  `gorm:"column:jenis_pajak;type:varchar(50)" json:"jenisPajak"`
	DPP              float64 `gorm:"column:dpp;default:0" json:"dpp"`
	PPN              float64 `gorm:"column:ppn;default:0" json:"ppn"`
	PPh              float64 `gorm:"column:pph;default:0" json:"pph"`
	NPWP             string  `gorm:"column:npwp;type:varchar(30)" json:"npwp"`
	Divisi           string  `gorm:"column:divisi;type:varchar(100)" json:"divisi"`
	PenanggungJawab  string  `gorm:"column:penanggung_jawab;type:varchar(100)" json:"penanggungJawab"`
	TanggalBayar     string  `gorm:"column:tanggal_bayar;type:varchar(20)" json:"tanggalBayar"`
	JatuhTempo       string  `gorm:"column:jatuh_tempo;type:varchar(20)" json:"jatuhTempo"`
	IsDeductible     bool    `gorm:"column:is_deductible;default:false" json:"isDeductible"`
	Catatan          string  `gorm:"column:catatan;type:text" json:"catatan"`
	LampiranURLs     string  `gorm:"column:lampiran_urls;type:text" json:"lampiranUrls"`
}

// EquipmentMonthlyFinanceRow is aggregated income/expense per equipment for a calendar month (YYYY-MM).
type EquipmentMonthlyFinanceRow struct {
	EquipmentID   uint    `json:"equipmentId" gorm:"column:equipment_id"`
	EquipmentName string  `json:"equipmentName" gorm:"column:equipment_name"`
	EquipmentType string  `json:"equipmentType" gorm:"column:equipment_type"`
	Income        float64 `json:"income" gorm:"column:income"`
	Expense       float64 `json:"expense" gorm:"column:expense"`
}

// EquipmentFinanceSumRow is lifetime totals per equipment_id (raw query scan).
type EquipmentFinanceSumRow struct {
	EquipmentID uint    `gorm:"column:equipment_id"`
	Income      float64 `gorm:"column:income"`
	Expense     float64 `gorm:"column:expense"`
}
