package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type DailyReportHandler struct {
	dailyReportService service.DailyReportService
}

func NewDailyReportHandler(dailyReportService service.DailyReportService) *DailyReportHandler {
	return &DailyReportHandler{
		dailyReportService: dailyReportService,
	}
}

// CreateDailyReport creates a new daily report
func (h *DailyReportHandler) CreateDailyReport(c echo.Context) error {
	var report entity.ReportDaily
	if err := c.Bind(&report); err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid request body"))
	}

	if err := h.dailyReportService.CreateDailyReport(&report); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusCreated, report)
}

// GetDailyReportsByProject gets all daily reports for a project
func (h *DailyReportHandler) GetDailyReportsByProject(c echo.Context) error {
	projectIDStr := c.Param("projectId")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 32)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid project ID"))
	}

	reports, err := h.dailyReportService.GetDailyReportsByProject(uint(projectID))
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, reports)
}

// GetDailyReportByID gets a specific daily report by ID
func (h *DailyReportHandler) GetDailyReportByID(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid report ID"))
	}

	report, err := h.dailyReportService.GetDailyReportByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	return response.Success(c, http.StatusOK, report)
}

// UpdateDailyReport updates a daily report
func (h *DailyReportHandler) UpdateDailyReport(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid report ID"))
	}

	var report entity.ReportDaily
	if err := c.Bind(&report); err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid request body"))
	}

	report.ID = uint(id)
	if err := h.dailyReportService.UpdateDailyReport(&report); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, report)
}

// DeleteDailyReport deletes a daily report
func (h *DailyReportHandler) DeleteDailyReport(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid report ID"))
	}

	if err := h.dailyReportService.DeleteDailyReport(uint(id)); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, nil)
}

// GetDailyReportsByDateRange gets daily reports within a date range
func (h *DailyReportHandler) GetDailyReportsByDateRange(c echo.Context) error {
	projectIDStr := c.Param("projectId")
	projectID, err := strconv.ParseUint(projectIDStr, 10, 32)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("Invalid project ID"))
	}

	startDate := c.QueryParam("startDate")
	endDate := c.QueryParam("endDate")

	if startDate == "" || endDate == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("Start date and end date are required"))
	}

	reports, err := h.dailyReportService.GetDailyReportsByDateRange(uint(projectID), startDate, endDate)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, reports)
}
