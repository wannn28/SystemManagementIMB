package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
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

	// Get old finance to check if it's synced from project
	oldFinance, err := h.service.GetFinanceByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	var finance entity.Finance
	if err := c.Bind(&finance); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	finance.ID = uint(id)
	if err := h.service.UpdateFinance(&finance); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// REVERSE SYNC: Update project entry if this finance is synced from project
	if oldFinance.Source == "project" {
		if oldFinance.ProjectIncomeID != nil && h.projectIncomeService != nil {
			// Update project income
			_, _ = h.projectIncomeService.UpdateIncome(*oldFinance.ProjectIncomeID, &entity.ProjectIncomeUpdateRequest{
				Tanggal:   finance.Tanggal,
				Kategori:  string(finance.Category),
				Deskripsi: finance.Keterangan,
				Jumlah:    finance.Jumlah,
				Status:    "Received", // Keep as Received since finance is Paid
			})
		}
		if oldFinance.ProjectExpenseID != nil && h.projectExpenseService != nil {
			// Update project expense
			_, _ = h.projectExpenseService.UpdateExpense(*oldFinance.ProjectExpenseID, &entity.ProjectExpenseUpdateRequest{
				Tanggal:   finance.Tanggal,
				Kategori:  string(finance.Category),
				Deskripsi: finance.Keterangan,
				Jumlah:    finance.Jumlah,
				Status:    "Paid", // Keep as Paid
			})
		}
	}

	activityType := entity.ActivityIncome
	if finance.Type == entity.Expense {
		activityType = entity.ActivityExpense
	}

	err = h.activityService.LogActivity(
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

	// REVERSE SYNC: Delete or update status of project entry if this finance is synced from project
	if finance.Source == "project" {
		if finance.ProjectIncomeID != nil && h.projectIncomeService != nil {
			// Change project income status to Pending (not fully delete)
			_, _ = h.projectIncomeService.UpdateIncome(*finance.ProjectIncomeID, &entity.ProjectIncomeUpdateRequest{
				Status: "Pending",
			})
		}
		if finance.ProjectExpenseID != nil && h.projectExpenseService != nil {
			// Change project expense status to Unpaid (not fully delete)
			_, _ = h.projectExpenseService.UpdateExpense(*finance.ProjectExpenseID, &entity.ProjectExpenseUpdateRequest{
				Status: "Unpaid",
			})
		}
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

// GetFinanceByDateRange handles filtering finance records by date range
func (h *FinanceHandler) GetFinanceByDateRange(c echo.Context) error {
	startDate := c.QueryParam("start_date")
	endDate := c.QueryParam("end_date")

	if startDate == "" || endDate == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("start_date and end_date are required"))
	}

	finances, err := h.service.GetFinanceByDateRange(startDate, endDate)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, finances)
}

// GetFinanceByAmountRange handles filtering finance records by amount range
func (h *FinanceHandler) GetFinanceByAmountRange(c echo.Context) error {
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

	finances, err := h.service.GetFinanceByAmountRange(minAmount, maxAmount)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, finances)
}

// GetFinanceByCategory handles filtering finance records by category
func (h *FinanceHandler) GetFinanceByCategory(c echo.Context) error {
	category := c.QueryParam("category")

	if category == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("category is required"))
	}

	// Validate category
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

	finances, err := h.service.GetFinanceByCategory(entity.FinanceCategory(category))
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, finances)
}

// GetFinanceByStatus handles filtering finance records by status
func (h *FinanceHandler) GetFinanceByStatus(c echo.Context) error {
	status := c.QueryParam("status")

	if status == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("status is required"))
	}

	// Validate status
	if status != "Paid" && status != "Unpaid" {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid status. Must be 'Paid' or 'Unpaid'"))
	}

	finances, err := h.service.GetFinanceByStatus(status)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, finances)
}

// GetFinanceByTypeWithPagination handles filtering finance records by type with pagination
func (h *FinanceHandler) GetFinanceByTypeWithPagination(c echo.Context) error {
	fType := c.QueryParam("type")

	if fType == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("type is required"))
	}

	// Validate type
	if fType != "income" && fType != "expense" {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid type. Must be 'income' or 'expense'"))
	}

	params := response.ParseQueryParams(c)

	// Add type filter to params
	if params.Filter == "" {
		params.Filter = "type:" + fType
	} else {
		params.Filter += ",type:" + fType
	}

	finances, total, err := h.service.GetAllFinanceWithPagination(params)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, finances, pagination)
}
