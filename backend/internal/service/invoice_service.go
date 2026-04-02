package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
)

type InvoiceService interface {
	Create(userID uint, inv *entity.Invoice) error
	Update(inv *entity.Invoice) error
	Delete(id uint) error
	GetByID(id uint) (*entity.Invoice, error)
	GetAllWithPagination(params response.QueryParams, userID uint) ([]entity.Invoice, int, error)
	GetCustomerSuggestions(userID uint, search string, limit int) ([]repository.CustomerSuggestion, error)
}

type invoiceService struct {
	repo repository.InvoiceRepository
}

func NewInvoiceService(repo repository.InvoiceRepository) InvoiceService {
	return &invoiceService{repo: repo}
}

func itemTotal(item *entity.InvoiceItem) float64 {
	if item.Total != 0 {
		return item.Total
	}
	if item.Days > 0 {
		rent := item.Days * item.Price
		bbm := item.BbmQuantity * item.BbmUnitPrice
		return rent + bbm
	}
	if item.Price > 0 && item.Quantity > 0 {
		return float64(item.Quantity) * item.Price
	}
	return float64(item.Quantity) * item.Price
}

func (s *invoiceService) Create(userID uint, inv *entity.Invoice) error {
	inv.UserID = userID
	if inv.AttachmentPhotosPerPage <= 0 {
		inv.AttachmentPhotosPerPage = 1
	}
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
	if inv.AttachmentPhotosPerPage <= 0 {
		inv.AttachmentPhotosPerPage = 1
	}
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

func (s *invoiceService) GetAllWithPagination(params response.QueryParams, userID uint) ([]entity.Invoice, int, error) {
	return s.repo.FindAllWithPagination(params, userID)
}

func (s *invoiceService) GetCustomerSuggestions(userID uint, search string, limit int) ([]repository.CustomerSuggestion, error) {
	return s.repo.FindCustomerSuggestions(userID, search, limit)
}
