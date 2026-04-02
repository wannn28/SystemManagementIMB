package http

import (
	"dashboardadminimb/internal/service"
	appmiddleware "dashboardadminimb/pkg/middleware"
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
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}

	income, expense, err := h.financeSvc.GetFinancialSummary(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	memberCount, err := h.memberSvc.GetMemberCount(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	projectCount, err := h.projectSvc.GetProjectCount(userID)
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
