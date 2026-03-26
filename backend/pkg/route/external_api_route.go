package route

import (
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterExternalAPIRoutes(e *echo.Echo, tokenService service.IntegrationAPITokenService, projectService service.ProjectService, financeService service.FinanceService, memberService service.MemberService) {
	h := http.NewExternalAPIHandler(projectService, financeService, memberService)
	g := e.Group("/api/external")

	g.GET("/projects", h.GetProjects, middleware.IntegrationTokenAuth(tokenService, "projects"))
	g.GET("/finance", h.GetFinance, middleware.IntegrationTokenAuth(tokenService, "finance"))
	g.GET("/reports", h.GetReports, middleware.IntegrationTokenAuth(tokenService, "reports"))
	g.GET("/team", h.GetTeam, middleware.IntegrationTokenAuth(tokenService, "team"))
}

