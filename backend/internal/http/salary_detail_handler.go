package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/internal/service"
	appmiddleware "dashboardadminimb/pkg/middleware"
	"dashboardadminimb/pkg/response"
	"fmt"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type SalaryDetailHandler struct {
	repo            repository.SalaryDetailRepository
	activityService service.ActivityService
}

func NewSalaryDetailHandler(
	repo repository.SalaryDetailRepository,
	activityService service.ActivityService,
) *SalaryDetailHandler {
	return &SalaryDetailHandler{
		repo:            repo,
		activityService: activityService,
	}
}

func (h *SalaryDetailHandler) CreateDetail(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	salaryID, _ := strconv.Atoi(c.Param("salaryId"))
	var detail entity.SalaryDetail
	if err := c.Bind(&detail); err != nil {
		return response.Error(c, 400, err)
	}
	detail.SalaryID = uint(salaryID)
	if err := h.repo.Create(&detail); err != nil {
		return response.Error(c, 500, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityIncome, "Detail Gaji Ditambahkan",
		fmt.Sprintf("Detail gaji untuk ID Salary %d: %s", salaryID, detail.Keterangan))
	return response.Success(c, 201, detail)
}

func (h *SalaryDetailHandler) UpdateDetail(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, _ := strconv.Atoi(c.Param("id"))
	salaryID, _ := strconv.Atoi(c.Param("salaryId"))
	var detail entity.SalaryDetail
	if err := c.Bind(&detail); err != nil {
		return response.Error(c, 400, err)
	}
	detail.ID = uint(id)
	detail.SalaryID = uint(salaryID)
	if err := h.repo.Update(&detail); err != nil {
		return response.Error(c, 500, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityUpdate, "Detail Gaji Diupdate",
		fmt.Sprintf("Update detail gaji ID %d untuk Salary ID %d", id, salaryID))
	return response.Success(c, 200, detail)
}

func (h *SalaryDetailHandler) DeleteDetail(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, _ := strconv.Atoi(c.Param("id"))
	detail, err := h.repo.FindByID(uint(id))
	if err != nil {
		return response.Error(c, 404, err)
	}
	if err := h.repo.Delete(uint(id)); err != nil {
		return response.Error(c, 500, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityExpense, "Detail Gaji Dihapus",
		fmt.Sprintf("Hapus detail gaji ID %d (Salary ID %d): %s", id, detail.SalaryID, detail.Keterangan))
	return response.Success(c, 204, nil)
}
