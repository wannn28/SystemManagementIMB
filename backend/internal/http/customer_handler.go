package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"dashboardadminimb/pkg/response"
)

type CustomerHandler struct {
	service service.CustomerService
}

func NewCustomerHandler(service service.CustomerService) *CustomerHandler {
	return &CustomerHandler{service: service}
}

func (h *CustomerHandler) List(c echo.Context) error {
	search := c.QueryParam("q")
	list, err := h.service.GetAll(search)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, list)
}

func (h *CustomerHandler) GetByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	cust, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, cust)
}

func (h *CustomerHandler) Create(c echo.Context) error {
	var body entity.Customer
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if body.Name == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "name is required"))
	}
	if err := h.service.Create(&body); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, body)
}

func (h *CustomerHandler) Update(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	existing, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var body entity.Customer
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	existing.Name = body.Name
	existing.Phone = body.Phone
	existing.Email = body.Email
	existing.Address = body.Address
	if err := h.service.Update(existing); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, existing)
}

func (h *CustomerHandler) Delete(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if _, err := h.service.GetByID(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.Delete(uint(id)); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}
