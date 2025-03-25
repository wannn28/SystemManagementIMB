// internal/http/salary_detail_handler.go
package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"fmt"
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
	salaryID, _ := strconv.Atoi(c.Param("salaryId"))

	var detail entity.SalaryDetail
	if err := c.Bind(&detail); err != nil {
		return response.Error(c, 400, err)
	}

	detail.SalaryID = uint(salaryID)
	if err := h.repo.Create(&detail); err != nil {
		return response.Error(c, 500, err)
	}

	// Log activity
	err := h.activityService.LogActivity(
		entity.ActivityIncome,
		"Detail Gaji Ditambahkan",
		fmt.Sprintf("Detail gaji untuk ID Salary %d: %s", salaryID, detail.Keterangan),
	)
	if err != nil {
		// Handle error logging, jangan gagalkan request
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, 201, detail)
}

func (h *SalaryDetailHandler) UpdateDetail(c echo.Context) error {
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

	// Log activity
	err := h.activityService.LogActivity(
		entity.ActivityUpdate,
		"Detail Gaji Diupdate",
		fmt.Sprintf("Update detail gaji ID %d untuk Salary ID %d", id, salaryID),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, 200, detail)
}

func (h *SalaryDetailHandler) DeleteDetail(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))

	// Dapatkan detail terlebih dahulu untuk logging
	detail, err := h.repo.FindByID(uint(id))
	if err != nil {
		return response.Error(c, 404, err)
	}

	if err := h.repo.Delete(uint(id)); err != nil {
		return response.Error(c, 500, err)
	}

	// Log activity
	err = h.activityService.LogActivity(
		entity.ActivityExpense,
		"Detail Gaji Dihapus",
		fmt.Sprintf("Hapus detail gaji ID %d (Salary ID %d): %s",
			id, detail.SalaryID, detail.Keterangan),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, 204, nil)
}
