package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"dashboardadminimb/pkg/response"
)

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
	var t entity.InvoiceTemplate
	if err := c.Bind(&t); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if t.Name == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "name is required"))
	}
	if err := h.service.Create(&t); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, t)
}

func (h *InvoiceTemplateHandler) Update(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	t, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var body entity.InvoiceTemplate
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	t.Name = body.Name
	t.Description = body.Description
	t.Layout = body.Layout
	t.Options = body.Options
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
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}
