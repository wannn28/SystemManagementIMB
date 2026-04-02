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

type ProjectIncomeHandler struct {
	service         service.ProjectIncomeService
	activityService service.ActivityService
	financeService  service.FinanceService
	projectService  service.ProjectService
}

func NewProjectIncomeHandler(service service.ProjectIncomeService, activityService service.ActivityService, financeService service.FinanceService, projectService service.ProjectService) *ProjectIncomeHandler {
	return &ProjectIncomeHandler{service, activityService, financeService, projectService}
}

func (h *ProjectIncomeHandler) financeKeteranganForIncome(userID uint, projectID int, kategori, deskripsi string) string {
	projectName := ""
	if h.projectService != nil {
		if proj, err := h.projectService.GetProjectByID(uint(projectID), userID); err == nil && proj != nil {
			projectName = proj.Name
		}
	}
	if projectName == "" {
		return fmt.Sprintf("Project Income - %s: %s", kategori, deskripsi)
	}
	return fmt.Sprintf("%s - %s: %s", projectName, kategori, deskripsi)
}

func (h *ProjectIncomeHandler) CreateIncome(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	var req entity.ProjectIncomeCreateRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	income, err := h.service.CreateIncome(&req)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if income.Status == "Received" {
		financeEntry := &entity.Finance{
			Tanggal:         income.Tanggal,
			Unit:            1,
			Jumlah:          income.Jumlah,
			HargaPerUnit:    income.Jumlah,
			Keterangan:      h.financeKeteranganForIncome(userID, income.ProjectID, income.Kategori, income.Deskripsi),
			Type:            entity.Income,
			Category:        entity.FinanceCategory(income.Kategori),
			Status:          "Paid",
			ProjectID:       &income.ProjectID,
			Source:          "project",
			ProjectIncomeID: &income.ID,
		}
		if err := h.financeService.CreateFinance(userID, financeEntry); err != nil {
			fmt.Println("Failed to sync to finance:", err)
		} else {
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
	_ = h.activityService.LogActivity(userID, entity.ActivityIncome, "Pemasukan Proyek Baru",
		fmt.Sprintf("%s - Rp %.2f", req.Kategori, req.Jumlah))
	return response.Success(c, http.StatusCreated, income)
}

func (h *ProjectIncomeHandler) UpdateIncome(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
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
	if oldIncome.Status != "Received" && income.Status == "Received" {
		financeEntry := &entity.Finance{
			Tanggal:         income.Tanggal,
			Unit:            1,
			Jumlah:          income.Jumlah,
			HargaPerUnit:    income.Jumlah,
			Keterangan:      h.financeKeteranganForIncome(userID, income.ProjectID, income.Kategori, income.Deskripsi),
			Type:            entity.Income,
			Category:        entity.FinanceCategory(income.Kategori),
			Status:          "Paid",
			ProjectID:       &income.ProjectID,
			Source:          "project",
			ProjectIncomeID: &income.ID,
		}
		if err := h.financeService.CreateFinance(userID, financeEntry); err != nil {
			fmt.Println("Failed to sync to finance:", err)
		} else {
			financeIDInt := int(financeEntry.ID)
			income.FinanceID = &financeIDInt
		}
	}
	if oldIncome.Status == "Received" && income.Status != "Received" {
		if oldIncome.FinanceID != nil {
			_ = h.financeService.DeleteFinance(uint(*oldIncome.FinanceID))
		}
	}
	if oldIncome.Status == "Received" && income.Status == "Received" && oldIncome.FinanceID != nil {
		financeEntry, err := h.financeService.GetFinanceByID(uint(*oldIncome.FinanceID))
		if err == nil {
			financeEntry.Tanggal = income.Tanggal
			financeEntry.Jumlah = income.Jumlah
			financeEntry.HargaPerUnit = income.Jumlah
			financeEntry.Keterangan = h.financeKeteranganForIncome(userID, income.ProjectID, income.Kategori, income.Deskripsi)
			financeEntry.Category = entity.FinanceCategory(income.Kategori)
			_ = h.financeService.UpdateFinance(financeEntry)
		}
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityIncome, "Update Pemasukan Proyek",
		fmt.Sprintf("%s - Rp %.2f", income.Kategori, income.Jumlah))
	return response.Success(c, http.StatusOK, income)
}

func (h *ProjectIncomeHandler) DeleteIncome(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	income, err := h.service.GetIncomeByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if income.FinanceID != nil {
		_ = h.financeService.DeleteFinance(uint(*income.FinanceID))
	}
	if err := h.service.DeleteIncome(id); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityIncome, "Hapus Pemasukan Proyek",
		fmt.Sprintf("%s - Rp %.2f", income.Kategori, income.Jumlah))
	return response.Success(c, http.StatusNoContent, nil)
}

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

func (h *ProjectIncomeHandler) GetAllIncomes(c echo.Context) error {
	incomes, err := h.service.GetAllIncomes()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, incomes)
}
