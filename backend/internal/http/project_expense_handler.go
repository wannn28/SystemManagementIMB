package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	appmiddleware "dashboardadminimb/pkg/middleware"
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
	projectService  service.ProjectService
}

func NewProjectExpenseHandler(service service.ProjectExpenseService, activityService service.ActivityService, financeService service.FinanceService, projectService service.ProjectService) *ProjectExpenseHandler {
	return &ProjectExpenseHandler{service, activityService, financeService, projectService}
}

func (h *ProjectExpenseHandler) financeKeteranganForExpense(userID uint, projectID int, kategori, deskripsi string) string {
	projectName := ""
	if h.projectService != nil {
		if proj, err := h.projectService.GetProjectByID(uint(projectID), userID); err == nil && proj != nil {
			projectName = proj.Name
		}
	}
	if projectName == "" {
		return fmt.Sprintf("Project Expense - %s: %s", kategori, deskripsi)
	}
	return fmt.Sprintf("%s - %s: %s", projectName, kategori, deskripsi)
}

func (h *ProjectExpenseHandler) CreateExpense(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	var req entity.ProjectExpenseCreateRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	expense, err := h.service.CreateExpense(&req)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if expense.Status == "Paid" {
		financeEntry := &entity.Finance{
			Tanggal:          expense.Tanggal,
			Unit:             1,
			Jumlah:           expense.Jumlah,
			HargaPerUnit:     expense.Jumlah,
			Keterangan:       h.financeKeteranganForExpense(userID, expense.ProjectID, expense.Kategori, expense.Deskripsi),
			Type:             entity.Expense,
			Category:         entity.FinanceCategory(expense.Kategori),
			Status:           "Paid",
			ProjectID:        &expense.ProjectID,
			Source:           "project",
			ProjectExpenseID: &expense.ID,
		}
		if err := h.financeService.CreateFinance(userID, financeEntry); err != nil {
			fmt.Println("Failed to sync to finance:", err)
		} else {
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
	_ = h.activityService.LogActivity(userID, entity.ActivityExpense, "Pengeluaran Proyek Baru",
		fmt.Sprintf("%s - Rp %.2f", req.Kategori, req.Jumlah))
	return response.Success(c, http.StatusCreated, expense)
}

func (h *ProjectExpenseHandler) UpdateExpense(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
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
	if oldExpense.Status != "Paid" && expense.Status == "Paid" {
		financeEntry := &entity.Finance{
			Tanggal:          expense.Tanggal,
			Unit:             1,
			Jumlah:           expense.Jumlah,
			HargaPerUnit:     expense.Jumlah,
			Keterangan:       h.financeKeteranganForExpense(userID, expense.ProjectID, expense.Kategori, expense.Deskripsi),
			Type:             entity.Expense,
			Category:         entity.FinanceCategory(expense.Kategori),
			Status:           "Paid",
			ProjectID:        &expense.ProjectID,
			Source:           "project",
			ProjectExpenseID: &expense.ID,
		}
		if err := h.financeService.CreateFinance(userID, financeEntry); err != nil {
			fmt.Println("Failed to sync to finance:", err)
		} else {
			financeIDInt := int(financeEntry.ID)
			expense.FinanceID = &financeIDInt
		}
	}
	if oldExpense.Status == "Paid" && expense.Status != "Paid" {
		if oldExpense.FinanceID != nil {
			_ = h.financeService.DeleteFinance(uint(*oldExpense.FinanceID))
		}
	}
	if oldExpense.Status == "Paid" && expense.Status == "Paid" && oldExpense.FinanceID != nil {
		financeEntry, err := h.financeService.GetFinanceByID(uint(*oldExpense.FinanceID))
		if err == nil {
			financeEntry.Tanggal = expense.Tanggal
			financeEntry.Jumlah = expense.Jumlah
			financeEntry.HargaPerUnit = expense.Jumlah
			financeEntry.Keterangan = h.financeKeteranganForExpense(userID, expense.ProjectID, expense.Kategori, expense.Deskripsi)
			financeEntry.Category = entity.FinanceCategory(expense.Kategori)
			_ = h.financeService.UpdateFinance(financeEntry)
		}
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityExpense, "Update Pengeluaran Proyek",
		fmt.Sprintf("%s - Rp %.2f", expense.Kategori, expense.Jumlah))
	return response.Success(c, http.StatusOK, expense)
}

func (h *ProjectExpenseHandler) DeleteExpense(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	expense, err := h.service.GetExpenseByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if expense.FinanceID != nil {
		_ = h.financeService.DeleteFinance(uint(*expense.FinanceID))
	}
	if err := h.service.DeleteExpense(id); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityExpense, "Hapus Pengeluaran Proyek",
		fmt.Sprintf("%s - Rp %.2f", expense.Kategori, expense.Jumlah))
	return response.Success(c, http.StatusNoContent, nil)
}

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

func (h *ProjectExpenseHandler) GetAllExpenses(c echo.Context) error {
	expenses, err := h.service.GetAllExpenses()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, expenses)
}

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
