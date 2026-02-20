package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterEquipmentRoutes(e *echo.Echo, cfg config.Config, equipmentService service.EquipmentService) {
	handler := http.NewEquipmentHandler(equipmentService)
	g := e.Group("/api/equipment")
	g.Use(middleware.AdminAuth(cfg))
	g.GET("", handler.List)
	g.GET("/:id", handler.GetByID)
	g.POST("", handler.Create)
	g.PUT("/:id", handler.Update)
	g.DELETE("/:id", handler.Delete)
}
