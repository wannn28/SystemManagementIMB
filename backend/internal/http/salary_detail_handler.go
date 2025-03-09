// internal/http/salary_detail_handler.go
package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
	"strconv"

	"github.com/labstack/echo/v4"
)

type SalaryDetailHandler struct {
	repo repository.SalaryDetailRepository
}

func NewSalaryDetailHandler(repo repository.SalaryDetailRepository) *SalaryDetailHandler {
	return &SalaryDetailHandler{repo}
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

	return response.Success(c, 201, detail)
}

func (h *SalaryDetailHandler) UpdateDetail(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var detail entity.SalaryDetail
	if err := c.Bind(&detail); err != nil {
		return response.Error(c, 400, err)
	}
	detail.ID = uint(id)
	if err := h.repo.Update(&detail); err != nil {
		return response.Error(c, 500, err)
	}
	return response.Success(c, 200, detail)
}

func (h *SalaryDetailHandler) DeleteDetail(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.repo.Delete(uint(id)); err != nil {
		return response.Error(c, 500, err)
	}
	return response.Success(c, 204, nil)
}
