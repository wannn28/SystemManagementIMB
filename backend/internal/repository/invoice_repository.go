package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"
	"strings"

	"gorm.io/gorm"
)

// CustomerSuggestion untuk daftar pilih pelanggan dari data invoice
type CustomerSuggestion struct {
	CustomerName    string `json:"customer_name"`
	CustomerPhone   string `json:"customer_phone"`
	CustomerEmail   string `json:"customer_email"`
	CustomerAddress string `json:"customer_address"`
}

type InvoiceRepository interface {
	Create(inv *entity.Invoice) error
	Update(inv *entity.Invoice) error
	Delete(id uint) error
	FindByID(id uint) (*entity.Invoice, error)
	FindAllWithPagination(params response.QueryParams) ([]entity.Invoice, int, error)
	FindCustomerSuggestions(search string, limit int) ([]CustomerSuggestion, error)
}

type invoiceRepository struct {
	db *gorm.DB
}

func NewInvoiceRepository(db *gorm.DB) InvoiceRepository {
	return &invoiceRepository{db: db}
}

func (r *invoiceRepository) Create(inv *entity.Invoice) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Items").Create(inv).Error; err != nil {
			return err
		}
		for i := range inv.Items {
			inv.Items[i].ID = 0
			inv.Items[i].InvoiceID = inv.ID
			if err := tx.Create(&inv.Items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *invoiceRepository) Update(inv *entity.Invoice) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(inv).Error; err != nil {
			return err
		}
		// Delete existing items and recreate (simple approach)
		if err := tx.Where("invoice_id = ?", inv.ID).Delete(&entity.InvoiceItem{}).Error; err != nil {
			return err
		}
		for i := range inv.Items {
			inv.Items[i].ID = 0
			inv.Items[i].InvoiceID = inv.ID
			if err := tx.Create(&inv.Items[i]).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *invoiceRepository) Delete(id uint) error {
	if err := r.db.Where("invoice_id = ?", id).Delete(&entity.InvoiceItem{}).Error; err != nil {
		return err
	}
	return r.db.Delete(&entity.Invoice{}, id).Error
}

func (r *invoiceRepository) FindByID(id uint) (*entity.Invoice, error) {
	var inv entity.Invoice
	err := r.db.Preload("Items").Preload("Template").First(&inv, id).Error
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *invoiceRepository) FindAllWithPagination(params response.QueryParams) ([]entity.Invoice, int, error) {
	var list []entity.Invoice
	qb := database.NewQueryBuilder(r.db)
	query := qb.BuildInvoiceQuery(params).Preload("Items").Preload("Template")
	query = r.applyInvoiceFilters(query, params)
	total, err := qb.Paginate(query, params, &list)
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *invoiceRepository) applyInvoiceFilters(query *gorm.DB, params response.QueryParams) *gorm.DB {
	if params.Filter == "" {
		return query
	}
	filters := parseFiltersForInvoice(params.Filter)
	if start, ok := filters["start_date"]; ok {
		if end, ok2 := filters["end_date"]; ok2 {
			query = query.Where("invoice_date BETWEEN ? AND ?", start, end)
		}
	}
	return query
}

func parseFiltersForInvoice(filterStr string) map[string]string {
	m := make(map[string]string)
	if filterStr == "" {
		return m
	}
	for _, pair := range strings.Split(filterStr, ",") {
		parts := strings.SplitN(pair, ":", 2)
		if len(parts) == 2 {
			m[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
		}
	}
	return m
}

// FindCustomerSuggestions returns distinct customers from invoices (nama + data terakhir), optional search by name
func (r *invoiceRepository) FindCustomerSuggestions(search string, limit int) ([]CustomerSuggestion, error) {
	if limit <= 0 {
		limit = 30
	}
	var out []CustomerSuggestion
	var query string
	var args []interface{}
	if search != "" {
		query = `
		SELECT i.customer_name AS customer_name, i.customer_phone AS customer_phone,
		       i.customer_email AS customer_email, i.customer_address AS customer_address
		FROM invoices i
		INNER JOIN (
			SELECT customer_name, MAX(id) AS mid FROM invoices
			WHERE customer_name != '' AND customer_name IS NOT NULL AND customer_name LIKE ?
			GROUP BY customer_name
		) t ON i.customer_name = t.customer_name AND i.id = t.mid
		ORDER BY i.id DESC
		LIMIT ?
		`
		args = []interface{}{"%" + search + "%", limit}
	} else {
		query = `
		SELECT i.customer_name AS customer_name, i.customer_phone AS customer_phone,
		       i.customer_email AS customer_email, i.customer_address AS customer_address
		FROM invoices i
		INNER JOIN (
			SELECT customer_name, MAX(id) AS mid FROM invoices
			WHERE customer_name != '' AND customer_name IS NOT NULL
			GROUP BY customer_name
		) t ON i.customer_name = t.customer_name AND i.id = t.mid
		ORDER BY i.id DESC
		LIMIT ?
		`
		args = []interface{}{limit}
	}
	err := r.db.Raw(query, args...).Scan(&out).Error
	return out, err
}
