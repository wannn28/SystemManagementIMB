package route

import (
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func RegisterFinanceRoutes(g *echo.Echo, financeService service.FinanceService) {
	handler := http.NewFinanceHandler(financeService)

	g.POST("/finance", handler.CreateFinance)
	g.GET("/finance", handler.GetAllFinance)
	g.GET("/finance/:id", handler.GetFinanceByID)
	g.PUT("/finance/:id", handler.UpdateFinance)
	g.DELETE("/finance/:id", handler.DeleteFinance)
}
