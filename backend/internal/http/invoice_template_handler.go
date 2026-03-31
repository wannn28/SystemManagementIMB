package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"

	"github.com/labstack/echo/v4"
)

// templateRequest dipakai untuk Create/Update agar options bisa diterima sebagai object JSON.
type templateRequest struct {
	Name           string          `json:"name"`
	Description    string          `json:"description"`
	Layout         string          `json:"layout"`
	DocumentType   string          `json:"document_type"`
	DefaultIntro   string          `json:"default_intro"`
	SignatureCount int             `json:"signature_count"`
	Options        json.RawMessage `json:"options"`
}

type InvoiceTemplateHandler struct {
	service service.InvoiceTemplateService
}

func NewInvoiceTemplateHandler(service service.InvoiceTemplateService) *InvoiceTemplateHandler {
	return &InvoiceTemplateHandler{service: service}
}

func (h *InvoiceTemplateHandler) List(c echo.Context) error {
	list, err := h.service.GetAll()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, list)
}

func (h *InvoiceTemplateHandler) GetByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	t, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, t)
}

func (h *InvoiceTemplateHandler) Create(c echo.Context) error {
	var req templateRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if req.Name == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "name is required"))
	}
	t := entity.InvoiceTemplate{
		Name:           req.Name,
		Description:    req.Description,
		Layout:         req.Layout,
		DocumentType:   req.DocumentType,
		DefaultIntro:   req.DefaultIntro,
		SignatureCount: req.SignatureCount,
		Options:        rawMessageToString(req.Options),
	}
	if t.DocumentType == "" {
		t.DocumentType = entity.DocumentTypeInvoice
	}
	if t.SignatureCount < 1 || t.SignatureCount > 2 {
		t.SignatureCount = 1
	}
	if err := h.service.Create(&t); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, t)
}

func rawMessageToString(r json.RawMessage) string {
	if len(r) == 0 {
		return "{}"
	}
	return string(r)
}

func (h *InvoiceTemplateHandler) Update(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	t, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var req templateRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	t.Name = req.Name
	t.Description = req.Description
	t.Layout = req.Layout
	t.DocumentType = req.DocumentType
	t.DefaultIntro = req.DefaultIntro
	t.SignatureCount = req.SignatureCount
	t.Options = rawMessageToString(req.Options)
	if t.DocumentType == "" {
		t.DocumentType = entity.DocumentTypeInvoice
	}
	if t.SignatureCount < 1 || t.SignatureCount > 2 {
		t.SignatureCount = 1
	}
	if err := h.service.Update(t); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, t)
}

func (h *InvoiceTemplateHandler) Delete(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if _, err := h.service.GetByID(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.Delete(uint(id)); err != nil {
		if errors.Is(err, service.ErrTemplateInUseByInvoices) {
			return response.Error(c, http.StatusConflict, err)
		}
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}
