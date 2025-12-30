package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterProjectIncomeRoutes(e *echo.Echo, projectIncomeService service.ProjectIncomeService, activityService service.ActivityService, financeService service.FinanceService, config config.Config) {
	handler := http.NewProjectIncomeHandler(projectIncomeService, activityService, financeService)
	g := e.Group("/api/project-incomes")
	g.Use(middleware.AdminAuth(config))

	g.POST("", handler.CreateIncome)
	g.GET("", handler.GetAllIncomes)
	g.GET("/:id", handler.GetIncomeByID)
	g.GET("/project/:projectId", handler.GetIncomesByProjectID)
	g.PUT("/:id", handler.UpdateIncome)
	g.DELETE("/:id", handler.DeleteIncome)
}

