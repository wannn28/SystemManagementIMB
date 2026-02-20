package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"dashboardadminimb/pkg/response"
)

// normalisasi due_date: kosong atau invalid (tahun < 1000) -> nil agar MySQL tidak error
func normalizeDueDate(s *string) *string {
	if s == nil || *s == "" {
		return nil
	}
	datePart := *s
	if len(datePart) < 10 {
		return nil
	}
	datePart = datePart[:10]
	t, err := time.Parse("2006-01-02", datePart)
	if err != nil {
		return nil
	}
	if t.Year() < 1000 {
		return nil
	}
	return s
}

type InvoiceHandler struct {
	service service.InvoiceService
}

func NewInvoiceHandler(service service.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{service: service}
}

func (h *InvoiceHandler) Create(c echo.Context) error {
	var inv entity.Invoice
	if err := c.Bind(&inv); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if inv.InvoiceNumber == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "invoice_number is required"))
	}
	if inv.CustomerName == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "customer_name is required"))
	}
	if inv.TemplateID == 0 {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "template_id is required"))
	}
	// MySQL DATE tidak menerima string kosong atau invalid (e.g. 0022-02-22); simpan NULL
	inv.DueDate = normalizeDueDate(inv.DueDate)
	if err := h.service.Create(&inv); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, inv)
}

func (h *InvoiceHandler) Update(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	existing, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var body entity.Invoice
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	existing.InvoiceNumber = body.InvoiceNumber
	existing.InvoiceDate = body.InvoiceDate
	existing.DueDate = normalizeDueDate(body.DueDate)
	existing.Status = body.Status
	existing.CustomerName = body.CustomerName
	existing.CustomerPhone = body.CustomerPhone
	existing.CustomerEmail = body.CustomerEmail
	existing.CustomerAddress = body.CustomerAddress
	existing.TaxPercent = body.TaxPercent
	existing.Notes = body.Notes
	existing.IncludeBbmNote = body.IncludeBbmNote
	existing.UseBbmColumns = body.UseBbmColumns
	existing.Location = body.Location
	existing.Subject = body.Subject
	existing.EquipmentName = body.EquipmentName
	existing.IntroParagraph = body.IntroParagraph
	existing.BankAccount = body.BankAccount
	existing.TerbilangCustom = body.TerbilangCustom
	existing.QuantityUnit = body.QuantityUnit
	existing.PriceUnitLabel = body.PriceUnitLabel
	existing.ItemColumnLabel = body.ItemColumnLabel
	existing.Items = body.Items
	if err := h.service.Update(existing); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	updated, _ := h.service.GetByID(uint(id))
	return response.Success(c, http.StatusOK, updated)
}

func (h *InvoiceHandler) Delete(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if _, err := h.service.GetByID(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.Delete(uint(id)); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *InvoiceHandler) GetByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	inv, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, inv)
}

func (h *InvoiceHandler) GetAllWithPagination(c echo.Context) error {
	params := response.ParseQueryParams(c)
	list, total, err := h.service.GetAllWithPagination(params)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, list, pagination)
}

func (h *InvoiceHandler) GetCustomerSuggestions(c echo.Context) error {
	search := c.QueryParam("q")
	limit := 30
	if l := c.QueryParam("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	list, err := h.service.GetCustomerSuggestions(search, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, list)
}
