// Di internal/http/statistics_handler.go
package http

import (
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"net/http"

	"github.com/labstack/echo/v4"
)

type StatisticsHandler struct {
	financeSvc service.FinanceService
	memberSvc  service.MemberService
	projectSvc service.ProjectService
}

func NewStatisticsHandler(f service.FinanceService, m service.MemberService, p service.ProjectService) *StatisticsHandler {
	return &StatisticsHandler{f, m, p}
}

func (h *StatisticsHandler) GetDashboardStats(c echo.Context) error {
	income, expense, err := h.financeSvc.GetFinancialSummary()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	memberCount, err := h.memberSvc.GetMemberCount()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	projectCount, err := h.projectSvc.GetProjectCount()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, map[string]interface{}{
		"total_income":  income,
		"total_expense": expense,
		"member_count":  memberCount,
		"project_count": projectCount,
	})
}
