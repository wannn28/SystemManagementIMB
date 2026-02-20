package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterCustomerRoutes(e *echo.Echo, cfg config.Config, customerService service.CustomerService) {
	handler := http.NewCustomerHandler(customerService)
	g := e.Group("/api/customers")
	g.Use(middleware.AdminAuth(cfg))
	g.GET("", handler.List)
	g.GET("/:id", handler.GetByID)
	g.POST("", handler.Create)
	g.PUT("/:id", handler.Update)
	g.DELETE("/:id", handler.Delete)
}
