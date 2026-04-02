package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	appmiddleware "dashboardadminimb/pkg/middleware"
	"dashboardadminimb/pkg/response"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type FinanceHandler struct {
	service               service.FinanceService
	activityService       service.ActivityService
	projectIncomeService  service.ProjectIncomeService
	projectExpenseService service.ProjectExpenseService
}

func NewFinanceHandler(service service.FinanceService, activityService service.ActivityService, projectIncomeService service.ProjectIncomeService, projectExpenseService service.ProjectExpenseService) *FinanceHandler {
	return &FinanceHandler{service, activityService, projectIncomeService, projectExpenseService}
}

func (h *FinanceHandler) CreateFinance(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	var finance entity.Finance
	if err := c.Bind(&finance); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if err := h.service.CreateFinance(userID, &finance); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	activityType := entity.ActivityIncome
	if finance.Type == entity.Expense {
		activityType = entity.ActivityExpense
	}
	_ = h.activityService.LogActivity(userID, activityType, "Transaksi Baru",
		fmt.Sprintf("%s - %s", finance.Keterangan, formatCurrency(finance.Jumlah)))
	return response.Success(c, http.StatusCreated, finance)
}

func formatCurrency(value float64) string {
	return fmt.Sprintf("%.2f", value)
}

func (h *FinanceHandler) UpdateFinance(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, _ := strconv.Atoi(c.Param("id"))

	oldFinance, err := h.service.GetFinanceByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	var finance entity.Finance
	if err := c.Bind(&finance); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	finance.ID = uint(id)
	finance.UserID = userID
	if err := h.service.UpdateFinance(&finance); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	if oldFinance.Source == "project" {
		if oldFinance.ProjectIncomeID != nil && h.projectIncomeService != nil {
			_, _ = h.projectIncomeService.UpdateIncome(*oldFinance.ProjectIncomeID, &entity.ProjectIncomeUpdateRequest{
				Tanggal:   finance.Tanggal,
				Kategori:  string(finance.Category),
				Deskripsi: finance.Keterangan,
				Jumlah:    finance.Jumlah,
				Status:    "Received",
			})
		}
		if oldFinance.ProjectExpenseID != nil && h.projectExpenseService != nil {
			_, _ = h.projectExpenseService.UpdateExpense(*oldFinance.ProjectExpenseID, &entity.ProjectExpenseUpdateRequest{
				Tanggal:   finance.Tanggal,
				Kategori:  string(finance.Category),
				Deskripsi: finance.Keterangan,
				Jumlah:    finance.Jumlah,
				Status:    "Paid",
			})
		}
	}

	activityType := entity.ActivityIncome
	if finance.Type == entity.Expense {
		activityType = entity.ActivityExpense
	}
	_ = h.activityService.LogActivity(userID, activityType, "Edit Transaksi",
		fmt.Sprintf("%s - %s", finance.Keterangan, formatCurrency(finance.Jumlah)))
	return response.Success(c, http.StatusOK, finance)
}

func (h *FinanceHandler) DeleteFinance(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, _ := strconv.Atoi(c.Param("id"))
	finance, err := h.service.GetFinanceByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	if finance.Source == "project" {
		if finance.ProjectIncomeID != nil && h.projectIncomeService != nil {
			_ = h.projectIncomeService.DeleteIncome(*finance.ProjectIncomeID)
		}
		if finance.ProjectExpenseID != nil && h.projectExpenseService != nil {
			_ = h.projectExpenseService.DeleteExpense(*finance.ProjectExpenseID)
		}
	}

	activityType := entity.ActivityIncome
	if finance.Type == entity.Expense {
		activityType = entity.ActivityExpense
	}
	_ = h.activityService.LogActivity(userID, activityType, "Delete Transaksi",
		fmt.Sprintf("%s - %s", finance.Keterangan, formatCurrency(finance.Jumlah)))
	if err := h.service.DeleteFinance(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *FinanceHandler) GetAllFinance(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	finances, err := h.service.GetAllFinance(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, finances)
}

func (h *FinanceHandler) GetAllFinanceWithPagination(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	params := response.ParseQueryParams(c)
	finances, total, err := h.service.GetAllFinanceWithPagination(params, userID)
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
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	income, expense, err := h.service.GetFinancialSummary(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]float64{
		"income":  income,
		"expense": expense,
	})
}

func (h *FinanceHandler) GetMonthlyComparison(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	data, err := h.service.GetMonthlyComparison(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, data)
}

func (h *FinanceHandler) GetFinanceByDateRange(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	startDate := c.QueryParam("start_date")
	endDate := c.QueryParam("end_date")
	if startDate == "" || endDate == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("start_date and end_date are required"))
	}
	finances, err := h.service.GetFinanceByDateRange(userID, startDate, endDate)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, finances)
}

func (h *FinanceHandler) GetFinanceByAmountRange(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	minAmountStr := c.QueryParam("min_amount")
	maxAmountStr := c.QueryParam("max_amount")
	if minAmountStr == "" || maxAmountStr == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("min_amount and max_amount are required"))
	}
	minAmount, err := strconv.ParseFloat(minAmountStr, 64)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid min_amount format"))
	}
	maxAmount, err := strconv.ParseFloat(maxAmountStr, 64)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid max_amount format"))
	}
	finances, err := h.service.GetFinanceByAmountRange(userID, minAmount, maxAmount)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, finances)
}

func (h *FinanceHandler) GetFinanceByCategory(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	category := c.QueryParam("category")
	if category == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("category is required"))
	}
	validCategories := []string{"Barang", "Jasa", "Sewa Alat Berat", "Gaji", "Uang Makan", "Kasbon", "Other"}
	isValid := false
	for _, validCat := range validCategories {
		if validCat == category {
			isValid = true
			break
		}
	}
	if !isValid {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid category"))
	}
	finances, err := h.service.GetFinanceByCategory(userID, entity.FinanceCategory(category))
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, finances)
}

func (h *FinanceHandler) GetFinanceByStatus(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	status := c.QueryParam("status")
	if status == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("status is required"))
	}
	if status != "Paid" && status != "Unpaid" {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid status. Must be 'Paid' or 'Unpaid'"))
	}
	finances, err := h.service.GetFinanceByStatus(userID, status)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, finances)
}

func (h *FinanceHandler) GetFinanceByTypeWithPagination(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	fType := c.QueryParam("type")
	if fType == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("type is required"))
	}
	if fType != "income" && fType != "expense" {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid type. Must be 'income' or 'expense'"))
	}
	params := response.ParseQueryParams(c)
	if params.Filter == "" {
		params.Filter = "type:" + fType
	} else {
		params.Filter += ",type:" + fType
	}
	finances, total, err := h.service.GetAllFinanceWithPagination(params, userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, finances, pagination)
}
