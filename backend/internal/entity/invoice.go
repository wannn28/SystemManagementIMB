package entity

import "time"

type InvoiceStatus string

const (
	InvoiceStatusDraft     InvoiceStatus = "draft"
	InvoiceStatusSent      InvoiceStatus = "sent"
	InvoiceStatusPaid      InvoiceStatus = "paid"
	InvoiceStatusCancelled InvoiceStatus = "cancelled"
)

type Invoice struct {
	ID                      uint             `gorm:"primaryKey" json:"id"`
	TemplateID              uint             `gorm:"not null" json:"template_id"`
	Template                *InvoiceTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
	CustomerID              *uint            `gorm:"index" json:"customer_id,omitempty"`
	Customer                *Customer        `gorm:"foreignKey:CustomerID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"customer,omitempty"`
	InvoiceNumber           string           `gorm:"type:varchar(100);not null;index" json:"invoice_number"`
	InvoiceDate             string           `gorm:"type:date;not null" json:"invoice_date"`
	DueDate                 *string          `gorm:"type:date" json:"due_date"` // NULL jika tidak diisi
	Status                  InvoiceStatus    `gorm:"type:varchar(20);default:'draft'" json:"status"`
	CustomerName            string           `gorm:"type:varchar(200);not null" json:"customer_name"`
	CustomerPhone           string           `gorm:"type:varchar(50)" json:"customer_phone"`
	CustomerEmail           string           `gorm:"type:varchar(200)" json:"customer_email"`
	CustomerAddress         string           `gorm:"type:text" json:"customer_address"`
	Subtotal                float64          `gorm:"type:decimal(15,2);default:0" json:"subtotal"`
	TaxPercent              float64          `gorm:"type:decimal(5,2);default:0" json:"tax_percent"`
	TaxAmount               float64          `gorm:"type:decimal(15,2);default:0" json:"tax_amount"`
	Total                   float64          `gorm:"type:decimal(15,2);default:0" json:"total"`
	Notes                   string           `gorm:"type:text" json:"notes"`
	IncludeBbmNote          bool             `gorm:"default:false" json:"include_bbm_note"`                         // Note "Sudah termasuk BBM"
	UseBbmColumns           bool             `gorm:"default:false" json:"use_bbm_columns"`                          // Tampilkan kolom BBM per baris
	Location                string           `gorm:"type:varchar(100)" json:"location"`                             // e.g. "Batam"
	Subject                 string           `gorm:"type:varchar(200)" json:"subject"`                              // Perihal, e.g. "Invoice"
	EquipmentName           string           `gorm:"type:varchar(255)" json:"equipment_name"`                       // Nama alat (gabungan)
	EquipmentNameAlatBerat  string           `gorm:"type:varchar(500)" json:"equipment_name_alat_berat"`            // Hanya alat berat dari daftar, untuk @alatberat
	EquipmentNameDumptruck  string           `gorm:"type:varchar(500)" json:"equipment_name_dumptruck"`             // Hanya dump truck dari daftar, untuk @dumptruck
	EquipmentNameManual     string           `gorm:"type:varchar(500)" json:"equipment_name_manual"`                // Alat manual, untuk @alatberatmanual
	IntroParagraph          string           `gorm:"type:text" json:"intro_paragraph"`                              // Paragraf pembuka
	BankAccount             string           `gorm:"type:varchar(200)" json:"bank_account"`                         // No Rekening + Bank
	TerbilangCustom         string           `gorm:"type:text" json:"terbilang_custom"`                             // Terbilang manual (kosong = pakai otomatis dari total)
	QuantityUnit            string           `gorm:"type:varchar(50);default:'hari'" json:"quantity_unit"`          // hari, jam, unit, jerigen
	PriceUnitLabel          string           `gorm:"type:varchar(50);default:'Harga/Hari'" json:"price_unit_label"` // Harga/Hari, Harga/Jam, dll
	ItemColumnLabel         string           `gorm:"type:varchar(50)" json:"item_column_label"`                     // Label kolom: Item, Keterangan, dll
	GroupColumnConfigs      string           `gorm:"type:text" json:"group_column_configs"`                         // JSON konfigurasi kolom per group
	AttachmentTitle         string           `gorm:"type:text" json:"attachment_title"`
	AttachmentPhotosPerPage int              `gorm:"default:1" json:"attachment_photos_per_page"`
	AttachmentsJSON         string           `gorm:"type:longtext;column:attachments_json" json:"-"`
	CreatedAt               time.Time        `json:"created_at"`
	UpdatedAt               time.Time        `json:"updated_at"`
	Items                   []InvoiceItem    `gorm:"foreignKey:InvoiceID" json:"items"`
}

func (Invoice) TableName() string {
	return "invoices"
}

type InvoiceItem struct {
	ID              uint    `gorm:"primaryKey" json:"id"`
	InvoiceID       uint    `gorm:"not null;index" json:"invoice_id"`
	ItemName        string  `gorm:"type:varchar(300);not null" json:"item_name"`
	ItemDisplayName string  `gorm:"type:varchar(300)" json:"item_display_name,omitempty"` // Tampilan Keterangan: plat untuk dump truck, nama untuk alat berat (jika kolom pakai auto)
	Description     string  `gorm:"type:text" json:"description"`
	Quantity        float64 `gorm:"type:decimal(10,2);not null;default:1" json:"quantity"` // Bisa 0.5, 1, 1.5, dll
	Price           float64 `gorm:"type:decimal(15,2);not null" json:"price"`
	Total           float64 `gorm:"type:decimal(15,2);not null" json:"total"`
	SortOrder       int     `gorm:"default:0" json:"sort_order"`
	RowDate         string  `gorm:"type:varchar(50)" json:"row_date"`         // Tanggal (e.g. "31 Januari 2026")
	Days            float64 `gorm:"type:decimal(10,2);default:0" json:"days"` // Hari (0.5, 1, ...)
	BbmQuantity     float64 `gorm:"type:decimal(10,2);default:0" json:"bbm_quantity"`
	BbmUnitPrice    float64 `gorm:"type:decimal(15,2);default:0" json:"bbm_unit_price"`
	EquipmentGroup  string  `gorm:"type:varchar(100)" json:"equipment_group"` // Unit berbeda (dari "Tambah Unit Berbeda")
	// CustomColumns: JSON object for template custom columns (e.g. {"custom_num_0": 1000000, "custom_num_1": 22000})
	CustomColumns string `gorm:"type:text" json:"custom_columns,omitempty"`
}

func (InvoiceItem) TableName() string {
	return "invoice_items"
}
