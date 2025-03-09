package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"strconv"

	"github.com/labstack/echo/v4"
)

type KasbonHandler struct {
	kasbonService service.KasbonService
	salaryService service.SalaryService
}

func NewKasbonHandler(kasbonService service.KasbonService, salaryService service.SalaryService) *KasbonHandler {
	return &KasbonHandler{
		kasbonService: kasbonService,
		salaryService: salaryService,
	}
}

func (h *KasbonHandler) CreateKasbon(c echo.Context) error {
	salaryID, err := strconv.Atoi(c.Param("salaryId"))
	if err != nil {
		return response.Error(c, 400, err)
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

	return response.Success(c, 200, kasbon)
}

func (h *KasbonHandler) DeleteKasbon(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	kasbon, err := h.kasbonService.GetKasbonsBySalary(uint(id))
	if err != nil {
		return response.Error(c, 500, err)
	}

	if err := h.kasbonService.DeleteKasbon(uint(id)); err != nil {
		return response.Error(c, 500, err)
	}

	// Recalculate Salary
	if len(kasbon) > 0 {
		if err := h.salaryService.RecalculateSalary(kasbon[0].SalaryID); err != nil {
			return response.Error(c, 500, err)
		}
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
