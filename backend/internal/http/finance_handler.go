package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type FinanceHandler struct {
	service         service.FinanceService
	activityService service.ActivityService
}

func NewFinanceHandler(service service.FinanceService, activityService service.ActivityService) *FinanceHandler {
	return &FinanceHandler{service, activityService}
}

func (h *FinanceHandler) CreateFinance(c echo.Context) error {
	var finance entity.Finance
	if err := c.Bind(&finance); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	if err := h.service.CreateFinance(&finance); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	activityType := entity.ActivityIncome
	if finance.Type == entity.Expense {
		activityType = entity.ActivityExpense
	}

	err := h.activityService.LogActivity(
		activityType,
		"Transaksi Baru",
		fmt.Sprintf("%s - %s", finance.Keterangan, formatCurrency(finance.Jumlah)),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, http.StatusCreated, finance)
}

func formatCurrency(value float64) string {
	return fmt.Sprintf("%.2f", value)
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
	activityType := entity.ActivityIncome
	if finance.Type == entity.Expense {
		activityType = entity.ActivityExpense
	}

	err := h.activityService.LogActivity(
		activityType,
		"Edit Transaksi",
		fmt.Sprintf("%s - %s", finance.Keterangan, formatCurrency(finance.Jumlah)),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, http.StatusOK, finance)
}

func (h *FinanceHandler) DeleteFinance(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	finance, err := h.service.GetFinanceByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	activityType := entity.ActivityIncome
	if finance.Type == entity.Expense {
		activityType = entity.ActivityExpense
	}

	err = h.activityService.LogActivity(
		activityType,
		"Delete Transaksi",
		fmt.Sprintf("%s - %s", finance.Keterangan, formatCurrency(finance.Jumlah)),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	if err := h.service.DeleteFinance(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	return response.Success(c, http.StatusNoContent, nil)
}

func (h *FinanceHandler) GetAllFinance(c echo.Context) error {
	finances, err := h.service.GetAllFinance()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, finances)
}

func (h *FinanceHandler) GetAllFinanceWithPagination(c echo.Context) error {
	params := response.ParseQueryParams(c)
	finances, total, err := h.service.GetAllFinanceWithPagination(params)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, finances, pagination)
}

func (h *FinanceHandler) GetFinanceByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	finance, err := h.service.GetFinanceByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, finance)
}

func (h *FinanceHandler) GetFinancialSummary(c echo.Context) error {
	income, expense, err := h.service.GetFinancialSummary()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]float64{
		"income":  income,
		"expense": expense,
	})
}

func (h *FinanceHandler) GetMonthlyComparison(c echo.Context) error {
	data, err := h.service.GetMonthlyComparison()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, data)
}
