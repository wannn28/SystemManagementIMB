package http

import (
	"net/http"

	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"

	"github.com/labstack/echo/v4"
)

type ExternalAPIHandler struct {
	projectService service.ProjectService
	financeService service.FinanceService
	memberService  service.MemberService
}

func NewExternalAPIHandler(projectService service.ProjectService, financeService service.FinanceService, memberService service.MemberService) *ExternalAPIHandler {
	return &ExternalAPIHandler{
		projectService: projectService,
		financeService: financeService,
		memberService:  memberService,
	}
}

func (h *ExternalAPIHandler) GetProjects(c echo.Context) error {
	data, err := h.projectService.GetAllProjects()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, data)
}

func (h *ExternalAPIHandler) GetFinance(c echo.Context) error {
	data, err := h.financeService.GetAllFinance()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, data)
}

func (h *ExternalAPIHandler) GetReports(c echo.Context) error {
	projects, err := h.projectService.GetAllProjects()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	out := make([]map[string]interface{}, 0, len(projects))
	for _, p := range projects {
		out = append(out, map[string]interface{}{
			"project_id": p.ID,
			"name":       p.Name,
			"reports":    p.Reports,
		})
	}
	return response.Success(c, http.StatusOK, out)
}

func (h *ExternalAPIHandler) GetTeam(c echo.Context) error {
	data, err := h.memberService.GetAllMembers()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, data)
}

