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

type ProjectIncomeHandler struct {
	service         service.ProjectIncomeService
	activityService service.ActivityService
	financeService  service.FinanceService
}

func NewProjectIncomeHandler(service service.ProjectIncomeService, activityService service.ActivityService, financeService service.FinanceService) *ProjectIncomeHandler {
	return &ProjectIncomeHandler{service, activityService, financeService}
}

// CreateIncome creates a new project income
func (h *ProjectIncomeHandler) CreateIncome(c echo.Context) error {
	var req entity.ProjectIncomeCreateRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	income, err := h.service.CreateIncome(&req)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// AUTO SYNC: Create Finance Entry (only if Received)
	if income.Status == "Received" {
		financeEntry := &entity.Finance{
			Tanggal:         income.Tanggal,
			Unit:            1,
			Jumlah:          income.Jumlah,
			HargaPerUnit:    income.Jumlah,
			Keterangan:      fmt.Sprintf("Project Income - %s: %s", income.Kategori, income.Deskripsi),
			Type:            entity.Income,
			Category:        entity.FinanceCategory(income.Kategori),
			Status:          "Paid", // Received = Paid in finance
			ProjectID:       &income.ProjectID,
			Source:          "project",
			ProjectIncomeID: &income.ID,
		}

		if err := h.financeService.CreateFinance(financeEntry); err != nil {
			// Log error but don't fail the request
			fmt.Println("Failed to sync to finance:", err)
		} else {
			// Save finance_id back to project_income
			financeIDInt := int(financeEntry.ID)
			income.FinanceID = &financeIDInt
			_, _ = h.service.UpdateIncome(income.ID, &entity.ProjectIncomeUpdateRequest{
				Tanggal:   income.Tanggal,
				Kategori:  income.Kategori,
				Deskripsi: income.Deskripsi,
				Jumlah:    income.Jumlah,
				Status:    income.Status,
			})
		}
	}

	// Log activity
	err = h.activityService.LogActivity(
		entity.ActivityIncome,
		"Pemasukan Proyek Baru",
		fmt.Sprintf("%s - Rp %.2f", req.Kategori, req.Jumlah),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, http.StatusCreated, income)
}

// UpdateIncome updates an existing project income
func (h *ProjectIncomeHandler) UpdateIncome(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// Get old income first
	oldIncome, err := h.service.GetIncomeByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	var req entity.ProjectIncomeUpdateRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	income, err := h.service.UpdateIncome(id, &req)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// AUTO SYNC: Update or Create Finance Entry
	// If status changed from non-Received to Received, create finance entry
	if oldIncome.Status != "Received" && income.Status == "Received" {
		financeEntry := &entity.Finance{
			Tanggal:         income.Tanggal,
			Unit:            1,
			Jumlah:          income.Jumlah,
			HargaPerUnit:    income.Jumlah,
			Keterangan:      fmt.Sprintf("Project Income - %s: %s", income.Kategori, income.Deskripsi),
			Type:            entity.Income,
			Category:        entity.FinanceCategory(income.Kategori),
			Status:          "Paid",
			ProjectID:       &income.ProjectID,
			Source:          "project",
			ProjectIncomeID: &income.ID,
		}
		if err := h.financeService.CreateFinance(financeEntry); err != nil {
			fmt.Println("Failed to sync to finance:", err)
		} else {
			// Save finance_id back to project_income
			financeIDInt := int(financeEntry.ID)
			income.FinanceID = &financeIDInt
		}
	}
	// Handle status change from Received to non-Received (delete finance entry)
	if oldIncome.Status == "Received" && income.Status != "Received" {
		if oldIncome.FinanceID != nil {
			if err := h.financeService.DeleteFinance(uint(*oldIncome.FinanceID)); err != nil {
				fmt.Println("Failed to delete synced finance entry:", err)
			}
		}
	}
	// Update finance entry if still Received but data changed
	if oldIncome.Status == "Received" && income.Status == "Received" && oldIncome.FinanceID != nil {
		financeEntry, err := h.financeService.GetFinanceByID(uint(*oldIncome.FinanceID))
		if err == nil {
			financeEntry.Tanggal = income.Tanggal
			financeEntry.Jumlah = income.Jumlah
			financeEntry.HargaPerUnit = income.Jumlah
			financeEntry.Keterangan = fmt.Sprintf("Project Income - %s: %s", income.Kategori, income.Deskripsi)
			financeEntry.Category = entity.FinanceCategory(income.Kategori)
			if err := h.financeService.UpdateFinance(financeEntry); err != nil {
				fmt.Println("Failed to update synced finance entry:", err)
			}
		}
	}

	// Log activity
	err = h.activityService.LogActivity(
		entity.ActivityIncome,
		"Update Pemasukan Proyek",
		fmt.Sprintf("%s - Rp %.2f", income.Kategori, income.Jumlah),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, http.StatusOK, income)
}

// DeleteIncome deletes a project income
func (h *ProjectIncomeHandler) DeleteIncome(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// Get income details before deleting for activity log
	income, err := h.service.GetIncomeByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	if err := h.service.DeleteIncome(id); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Log activity
	err = h.activityService.LogActivity(
		entity.ActivityIncome,
		"Hapus Pemasukan Proyek",
		fmt.Sprintf("%s - Rp %.2f", income.Kategori, income.Jumlah),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, http.StatusNoContent, nil)
}

// GetIncomeByID gets a single income by ID
func (h *ProjectIncomeHandler) GetIncomeByID(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	income, err := h.service.GetIncomeByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	return response.Success(c, http.StatusOK, income)
}

// GetIncomesByProjectID gets all incomes for a specific project
func (h *ProjectIncomeHandler) GetIncomesByProjectID(c echo.Context) error {
	projectID, err := strconv.Atoi(c.Param("projectId"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	incomes, err := h.service.GetIncomesByProjectID(projectID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, incomes)
}

// GetAllIncomes gets all project incomes
func (h *ProjectIncomeHandler) GetAllIncomes(c echo.Context) error {
	incomes, err := h.service.GetAllIncomes()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, incomes)
}

