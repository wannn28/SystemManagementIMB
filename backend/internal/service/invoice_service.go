package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
)

type InvoiceService interface {
	Create(inv *entity.Invoice) error
	Update(inv *entity.Invoice) error
	Delete(id uint) error
	GetByID(id uint) (*entity.Invoice, error)
	GetAllWithPagination(params response.QueryParams) ([]entity.Invoice, int, error)
	GetCustomerSuggestions(search string, limit int) ([]repository.CustomerSuggestion, error)
}

type invoiceService struct {
	repo repository.InvoiceRepository
}

func NewInvoiceService(repo repository.InvoiceRepository) InvoiceService {
	return &invoiceService{repo: repo}
}

func itemTotal(item *entity.InvoiceItem) float64 {
	// Baris sewa dengan Hari & Harga/Hari (dan optional BBM)
	if item.Days > 0 {
		rent := item.Days * item.Price
		bbm := item.BbmQuantity * item.BbmUnitPrice
		return rent + bbm
	}
	// Baris tetap (e.g. Mobilisasi PP): Jumlah tetap = Price (frontend kirim quantity=1, price=jumlah)
	if item.Price > 0 && item.Quantity > 0 {
		return float64(item.Quantity) * item.Price
	}
	if item.Total > 0 {
		return item.Total
	}
	return float64(item.Quantity) * item.Price
}

func (s *invoiceService) Create(inv *entity.Invoice) error {
	var subtotal float64
	for i := range inv.Items {
		inv.Items[i].Total = itemTotal(&inv.Items[i])
		subtotal += inv.Items[i].Total
	}
	inv.Subtotal = subtotal
	inv.TaxAmount = subtotal * (inv.TaxPercent / 100)
	inv.Total = subtotal + inv.TaxAmount
	if inv.Status == "" {
		inv.Status = entity.InvoiceStatusDraft
	}
	return s.repo.Create(inv)
}

func (s *invoiceService) Update(inv *entity.Invoice) error {
	var subtotal float64
	for i := range inv.Items {
		inv.Items[i].Total = itemTotal(&inv.Items[i])
		subtotal += inv.Items[i].Total
	}
	inv.Subtotal = subtotal
	inv.TaxAmount = subtotal * (inv.TaxPercent / 100)
	inv.Total = subtotal + inv.TaxAmount
	return s.repo.Update(inv)
}

func (s *invoiceService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *invoiceService) GetByID(id uint) (*entity.Invoice, error) {
	return s.repo.FindByID(id)
}

func (s *invoiceService) GetAllWithPagination(params response.QueryParams) ([]entity.Invoice, int, error) {
	return s.repo.FindAllWithPagination(params)
}

func (s *invoiceService) GetCustomerSuggestions(search string, limit int) ([]repository.CustomerSuggestion, error) {
	return s.repo.FindCustomerSuggestions(search, limit)
}
