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
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
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
	if err := h.salaryService.RecalculateSalary(uint(salaryID)); err != nil {
		return response.Error(c, 500, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityIncome, "Create Kasbon",
		fmt.Sprintf("Create Kasbon untuk %s", salary.Member.FullName))
	return response.Success(c, 201, kasbon)
}

func (h *KasbonHandler) UpdateKasbon(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, _ := strconv.Atoi(c.Param("id"))
	var kasbon entity.Kasbon
	if err := c.Bind(&kasbon); err != nil {
		return response.Error(c, 400, err)
	}
	kasbon.ID = uint(id)
	if err := h.kasbonService.UpdateKasbon(&kasbon); err != nil {
		return response.Error(c, 500, err)
	}
	if err := h.salaryService.RecalculateSalary(kasbon.SalaryID); err != nil {
		return response.Error(c, 500, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityUpdate, "Update Kasbon",
		fmt.Sprintf("Update Kasbon dengan id : %d", id))
	return response.Success(c, 200, kasbon)
}

func (h *KasbonHandler) DeleteKasbon(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	kasbonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, 400, err)
	}
	kasbon, err := h.kasbonService.GetKasbonByID(uint(kasbonID))
	if err != nil {
		return response.Error(c, 404, err)
	}
	if err := h.kasbonService.DeleteKasbon(uint(kasbonID)); err != nil {
		return response.Error(c, 500, err)
	}
	if err := h.salaryService.RecalculateSalary(kasbon.SalaryID); err != nil {
		return response.Error(c, 500, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityExpense, "Delete Kasbon",
		fmt.Sprintf("Delete Kasbon dengan id :  %d", kasbonID))
	return response.Success(c, 204, nil)
}

func (h *KasbonHandler) GetKasbonsBySalary(c echo.Context) error {
	salaryID, err := strconv.Atoi(c.Param("salaryId"))
	if err != nil {
		return response.Error(c, 400, err)
	}
	kasbons, err := h.kasbonService.GetKasbonsBySalary(uint(salaryID))
	if err != nil {
		return response.Error(c, 500, err)
	}
	return response.Success(c, 200, kasbons)
}

func (h *KasbonHandler) GetAllKasbonsWithPagination(c echo.Context) error {
	params := response.ParseQueryParams(c)
	kasbons, total, err := h.kasbonService.GetAllKasbonsWithPagination(params)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, kasbons, pagination)
}
