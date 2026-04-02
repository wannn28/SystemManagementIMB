package entity

import "time"

// DocumentType untuk template: invoice, penawaran, pre_order, dll.
const (
	DocumentTypeInvoice   = "invoice"
	DocumentTypePenawaran = "penawaran"
	DocumentTypePreOrder  = "pre_order"
)

type InvoiceTemplate struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	UserID         uint      `gorm:"not null;index;default:1" json:"user_id"`
	Name           string    `gorm:"type:varchar(200);not null" json:"name"`
	Description    string    `gorm:"type:text" json:"description"`
	Layout         string    `gorm:"type:varchar(100)" json:"layout"`
	DocumentType   string    `gorm:"type:varchar(50);default:'invoice'" json:"document_type"`   // invoice, penawaran, pre_order, dll.
	DefaultIntro   string    `gorm:"type:text" json:"default_intro"`                             // Kalimat default pembuka
	SignatureCount int       `gorm:"type:tinyint;default:1" json:"signature_count"`                // 1 = kanan saja, 2 = kiri & kanan
	Options        string    `gorm:"type:json" json:"options"`                                    // JSON: item_columns [{key, label}], dll.
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (InvoiceTemplate) TableName() string {
	return "invoice_templates"
}
