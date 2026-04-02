package service

import (
	"errors"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

var ErrTemplateInUseByInvoices = errors.New("template masih dipakai oleh invoice atau penawaran yang sudah ada; ubah atau hapus dokumen tersebut terlebih dahulu")

type InvoiceTemplateService interface {
	Create(userID uint, t *entity.InvoiceTemplate) error
	Update(t *entity.InvoiceTemplate) error
	Delete(id uint) error
	GetAll(userID uint) ([]entity.InvoiceTemplate, error)
	GetByID(id uint) (*entity.InvoiceTemplate, error)
}

type invoiceTemplateService struct {
	repo repository.InvoiceTemplateRepository
}

func NewInvoiceTemplateService(repo repository.InvoiceTemplateRepository) InvoiceTemplateService {
	return &invoiceTemplateService{repo: repo}
}

func (s *invoiceTemplateService) Create(userID uint, t *entity.InvoiceTemplate) error {
	t.UserID = userID
	return s.repo.Create(t)
}

func (s *invoiceTemplateService) Update(t *entity.InvoiceTemplate) error {
	return s.repo.Update(t)
}

func (s *invoiceTemplateService) Delete(id uint) error {
	n, err := s.repo.CountInvoicesUsingTemplate(id)
	if err != nil {
		return err
	}
	if n > 0 {
		return ErrTemplateInUseByInvoices
	}
	return s.repo.Delete(id)
}

func (s *invoiceTemplateService) GetAll(userID uint) ([]entity.InvoiceTemplate, error) {
	return s.repo.FindAll(userID)
}

func (s *invoiceTemplateService) GetByID(id uint) (*entity.InvoiceTemplate, error) {
	return s.repo.FindByID(id)
}
