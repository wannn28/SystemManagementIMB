package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"fmt"
	"strconv"

	"github.com/labstack/echo/v4"
)

type KasbonHandler struct {
	kasbonService   service.KasbonService
	salaryService   service.SalaryService
	activityService service.ActivityService
}

func NewKasbonHandler(kasbonService service.KasbonService, salaryService service.SalaryService, activityService service.ActivityService) *KasbonHandler {
	return &KasbonHandler{
		kasbonService:   kasbonService,
		salaryService:   salaryService,
		activityService: activityService,
	}
}

func (h *KasbonHandler) CreateKasbon(c echo.Context) error {
	salaryID, err := strconv.Atoi(c.Param("salaryId"))
	if err != nil {
		return response.Error(c, 400, err)
	}
	salary, err := h.salaryService.GetSalaryByID(uint(salaryID))
	if err != nil {
		return response.Error(c, 500, err)
	}
	var kasbon entity.Kasbon
	if err := c.Bind(&kasbon); err != nil {
		return response.Error(c, 400, err)
	}

	kasbon.SalaryID = uint(salaryID)
	if err := h.kasbonService.CreateKasbon(&kasbon); err != nil {
		return response.Error(c, 500, err)
	}

	// Recalculate Salary
	if err := h.salaryService.RecalculateSalary(uint(salaryID)); err != nil {
		return response.Error(c, 500, err)
	}
	err = h.activityService.LogActivity(
		entity.ActivityIncome,
		"Create Kasbon",
		fmt.Sprintf("Create Kasbon untuk %s", salary.Member.FullName),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, 201, kasbon)
}

func (h *KasbonHandler) UpdateKasbon(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var kasbon entity.Kasbon
	if err := c.Bind(&kasbon); err != nil {
		return response.Error(c, 400, err)
	}
	kasbon.ID = uint(id)
	if err := h.kasbonService.UpdateKasbon(&kasbon); err != nil {
		return response.Error(c, 500, err)
	}

	// Recalculate Salary
	if err := h.salaryService.RecalculateSalary(kasbon.SalaryID); err != nil {
		return response.Error(c, 500, err)
	}
	err := h.activityService.LogActivity(
		entity.ActivityUpdate,
		"Update Kasbon",
		fmt.Sprintf("Update Kasbon dengan id : %d", id),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, 200, kasbon)
}

func (h *KasbonHandler) DeleteKasbon(c echo.Context) error {
	kasbonID, err := strconv.Atoi(c.Param("id")) // ID kasbon dari URL
	if err != nil {
		return response.Error(c, 400, err)
	}

	// Dapatkan kasbon untuk mendapatkan SalaryID
	kasbon, err := h.kasbonService.GetKasbonByID(uint(kasbonID))
	if err != nil {
		return response.Error(c, 404, err)
	}

	// Hapus kasbon
	if err := h.kasbonService.DeleteKasbon(uint(kasbonID)); err != nil {
		return response.Error(c, 500, err)
	}

	// Recalculate Salary
	if err := h.salaryService.RecalculateSalary(kasbon.SalaryID); err != nil {
		return response.Error(c, 500, err)
	}
	err = h.activityService.LogActivity(
		entity.ActivityExpense,
		"Delete Kasbon",
		fmt.Sprintf("Delete Kasbon dengan id :  %d", kasbonID),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, 204, nil)
}

func (h *KasbonHandler) GetKasbonsBySalary(c echo.Context) error {
	salaryID, _ := strconv.Atoi(c.Param("salaryId"))
	kasbons, err := h.kasbonService.GetKasbonsBySalary(uint(salaryID))
	if err != nil {
		return response.Error(c, 500, err)
	}
	return response.Success(c, 200, kasbons)
}
