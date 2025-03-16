package route

import (
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func RegisterFinanceRoutes(e *echo.Echo, financeService service.FinanceService) {
	handler := http.NewFinanceHandler(financeService)

	e.POST("/finance", handler.CreateFinance)
	e.GET("/finance", handler.GetAllFinance)
	e.GET("/finance/:id", handler.GetFinanceByID)
	e.PUT("/finance/:id", handler.UpdateFinance)
	e.DELETE("/finance/:id", handler.DeleteFinance)
}
