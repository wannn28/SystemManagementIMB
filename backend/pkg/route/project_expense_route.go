package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterProjectExpenseRoutes(e *echo.Echo, projectExpenseService service.ProjectExpenseService, activityService service.ActivityService, financeService service.FinanceService, config config.Config) {
	handler := http.NewProjectExpenseHandler(projectExpenseService, activityService, financeService)
	g := e.Group("/api/project-expenses")
	g.Use(middleware.AdminAuth(config))

	g.POST("", handler.CreateExpense)
	g.GET("", handler.GetAllExpenses)
	g.GET("/:id", handler.GetExpenseByID)
	g.GET("/project/:projectId", handler.GetExpensesByProjectID)
	g.GET("/project/:projectId/financial-summary", handler.GetFinancialSummary)
	g.PUT("/:id", handler.UpdateExpense)
	g.DELETE("/:id", handler.DeleteExpense)
}

