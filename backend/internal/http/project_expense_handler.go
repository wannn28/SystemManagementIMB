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

type ProjectExpenseHandler struct {
	service         service.ProjectExpenseService
	activityService service.ActivityService
	financeService  service.FinanceService
}

func NewProjectExpenseHandler(service service.ProjectExpenseService, activityService service.ActivityService, financeService service.FinanceService) *ProjectExpenseHandler {
	return &ProjectExpenseHandler{service, activityService, financeService}
}

// CreateExpense creates a new project expense
func (h *ProjectExpenseHandler) CreateExpense(c echo.Context) error {
	var req entity.ProjectExpenseCreateRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	expense, err := h.service.CreateExpense(&req)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// AUTO SYNC: Create Finance Entry (only if Paid)
	if expense.Status == "Paid" {
		financeEntry := &entity.Finance{
			Tanggal:          expense.Tanggal,
			Unit:             1,
			Jumlah:           expense.Jumlah,
			HargaPerUnit:     expense.Jumlah,
			Keterangan:       fmt.Sprintf("Project Expense - %s: %s", expense.Kategori, expense.Deskripsi),
			Type:             entity.Expense,
			Category:         entity.FinanceCategory(expense.Kategori),
			Status:           "Paid",
			ProjectID:        &expense.ProjectID,
			Source:           "project",
			ProjectExpenseID: &expense.ID,
		}

		if err := h.financeService.CreateFinance(financeEntry); err != nil {
			// Log error but don't fail the request
			fmt.Println("Failed to sync to finance:", err)
		} else {
			// Save finance_id back to project_expense
			financeIDInt := int(financeEntry.ID)
			expense.FinanceID = &financeIDInt
			_, _ = h.service.UpdateExpense(expense.ID, &entity.ProjectExpenseUpdateRequest{
				Tanggal:   expense.Tanggal,
				Kategori:  expense.Kategori,
				Deskripsi: expense.Deskripsi,
				Jumlah:    expense.Jumlah,
				Status:    expense.Status,
			})
		}
	}

	// Log activity
	err = h.activityService.LogActivity(
		entity.ActivityExpense,
		"Pengeluaran Proyek Baru",
		fmt.Sprintf("%s - Rp %.2f", req.Kategori, req.Jumlah),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, http.StatusCreated, expense)
}

// UpdateExpense updates an existing project expense
func (h *ProjectExpenseHandler) UpdateExpense(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// Get old expense first
	oldExpense, err := h.service.GetExpenseByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	var req entity.ProjectExpenseUpdateRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	expense, err := h.service.UpdateExpense(id, &req)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// AUTO SYNC: Update or Create Finance Entry
	// If status changed from non-Paid to Paid, create finance entry
	if oldExpense.Status != "Paid" && expense.Status == "Paid" {
		financeEntry := &entity.Finance{
			Tanggal:          expense.Tanggal,
			Unit:             1,
			Jumlah:           expense.Jumlah,
			HargaPerUnit:     expense.Jumlah,
			Keterangan:       fmt.Sprintf("Project Expense - %s: %s", expense.Kategori, expense.Deskripsi),
			Type:             entity.Expense,
			Category:         entity.FinanceCategory(expense.Kategori),
			Status:           "Paid",
			ProjectID:        &expense.ProjectID,
			Source:           "project",
			ProjectExpenseID: &expense.ID,
		}
		if err := h.financeService.CreateFinance(financeEntry); err != nil {
			fmt.Println("Failed to sync to finance:", err)
		} else {
			// Save finance_id back to project_expense
			financeIDInt := int(financeEntry.ID)
			expense.FinanceID = &financeIDInt
		}
	}
	// Handle status change from Paid to non-Paid (delete finance entry)
	if oldExpense.Status == "Paid" && expense.Status != "Paid" {
		if oldExpense.FinanceID != nil {
			if err := h.financeService.DeleteFinance(uint(*oldExpense.FinanceID)); err != nil {
				fmt.Println("Failed to delete synced finance entry:", err)
			}
		}
	}
	// Update finance entry if still Paid but data changed
	if oldExpense.Status == "Paid" && expense.Status == "Paid" && oldExpense.FinanceID != nil {
		financeEntry, err := h.financeService.GetFinanceByID(uint(*oldExpense.FinanceID))
		if err == nil {
			financeEntry.Tanggal = expense.Tanggal
			financeEntry.Jumlah = expense.Jumlah
			financeEntry.HargaPerUnit = expense.Jumlah
			financeEntry.Keterangan = fmt.Sprintf("Project Expense - %s: %s", expense.Kategori, expense.Deskripsi)
			financeEntry.Category = entity.FinanceCategory(expense.Kategori)
			if err := h.financeService.UpdateFinance(financeEntry); err != nil {
				fmt.Println("Failed to update synced finance entry:", err)
			}
		}
	}

	// Log activity
	err = h.activityService.LogActivity(
		entity.ActivityExpense,
		"Update Pengeluaran Proyek",
		fmt.Sprintf("%s - Rp %.2f", expense.Kategori, expense.Jumlah),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, http.StatusOK, expense)
}

// DeleteExpense deletes a project expense
func (h *ProjectExpenseHandler) DeleteExpense(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// Get expense details before deleting for activity log
	expense, err := h.service.GetExpenseByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	if err := h.service.DeleteExpense(id); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Log activity
	err = h.activityService.LogActivity(
		entity.ActivityExpense,
		"Hapus Pengeluaran Proyek",
		fmt.Sprintf("%s - Rp %.2f", expense.Kategori, expense.Jumlah),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, http.StatusNoContent, nil)
}

// GetExpenseByID gets a single expense by ID
func (h *ProjectExpenseHandler) GetExpenseByID(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	expense, err := h.service.GetExpenseByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	return response.Success(c, http.StatusOK, expense)
}

// GetExpensesByProjectID gets all expenses for a specific project
func (h *ProjectExpenseHandler) GetExpensesByProjectID(c echo.Context) error {
	projectID, err := strconv.Atoi(c.Param("projectId"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	expenses, err := h.service.GetExpensesByProjectID(projectID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, expenses)
}

// GetAllExpenses gets all project expenses
func (h *ProjectExpenseHandler) GetAllExpenses(c echo.Context) error {
	expenses, err := h.service.GetAllExpenses()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, expenses)
}

// GetFinancialSummary gets financial summary for a project
func (h *ProjectExpenseHandler) GetFinancialSummary(c echo.Context) error {
	projectID, err := strconv.Atoi(c.Param("projectId"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	summary, err := h.service.GetFinancialSummary(projectID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, summary)
}
