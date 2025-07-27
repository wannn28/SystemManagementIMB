package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterFinanceRoutes(e *echo.Echo, financeService service.FinanceService, config config.Config, activityService service.ActivityService) {
	handler := http.NewFinanceHandler(financeService, activityService)
	g := e.Group("/api/finance")
	g.Use(middleware.AdminAuth(config))
	g.POST("", handler.CreateFinance)
	g.GET("", handler.GetAllFinance)
	g.GET("/paginated", handler.GetAllFinanceWithPagination)
	g.GET("/:id", handler.GetFinanceByID)
	g.PUT("/:id", handler.UpdateFinance)
	g.DELETE("/:id", handler.DeleteFinance)
	g.GET("/summary", handler.GetFinancialSummary)
	g.GET("/monthly", handler.GetMonthlyComparison)
}
