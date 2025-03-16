package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type FinanceHandler struct {
	service service.FinanceService
}

func NewFinanceHandler(service service.FinanceService) *FinanceHandler {
	return &FinanceHandler{service}
}

func (h *FinanceHandler) CreateFinance(c echo.Context) error {
	var finance entity.Finance
	if err := c.Bind(&finance); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	if err := h.service.CreateFinance(&finance); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusCreated, finance)
}

func (h *FinanceHandler) UpdateFinance(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var finance entity.Finance
	if err := c.Bind(&finance); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	finance.ID = uint(id)
	if err := h.service.UpdateFinance(&finance); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, finance)
}

func (h *FinanceHandler) DeleteFinance(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.DeleteFinance(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *FinanceHandler) GetAllFinance(c echo.Context) error {
	fType := c.QueryParam("type")

	if fType != "" {
		finances, err := h.service.GetFinanceByType(entity.FinanceType(fType))
		if err != nil {
			return response.Error(c, http.StatusInternalServerError, err)
		}
		return response.Success(c, http.StatusOK, finances)
	}

	finances, err := h.service.GetAllFinance()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, finances)
}

func (h *FinanceHandler) GetFinanceByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	finance, err := h.service.GetFinanceByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, finance)
}
