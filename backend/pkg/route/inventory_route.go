// Di pkg/route/inventory_route.go
package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterInventoryRoutes(e *echo.Echo, service service.InventoryService, uploadDir string, baseURL string, config config.Config, activityService service.ActivityService) {
	handler := http.NewInventoryHandler(service, uploadDir, baseURL, activityService)
	g := e.Group("/api")
	g.Use(middleware.AdminAuth(config))
	// Category routes
	g.GET("/inventory/categories", handler.GetAllCategories)
	g.POST("/inventory/categories", handler.CreateCategory)
	g.GET("/inventory/categories/:id", handler.GetCategory)
	g.PUT("/inventory/categories/:id", handler.UpdateCategory)
	g.DELETE("/inventory/categories/:id", handler.DeleteCategory)

	// Data routes
	g.GET("/inventory/categories/:categoryId/data", handler.GetCategoryData)
	g.POST("/inventory/categories/:categoryId/data", handler.CreateData)
	g.PUT("/inventory/data/:id", handler.UpdateData)
	g.DELETE("/inventory/data/:id", handler.DeleteData)

	// Upload route
	// g.POST("/inventory/upload", handler.UploadImage)
	g.POST("/inventory/data/:dataId/images", handler.UploadImage)
	g.DELETE("/inventory/data/:dataId/images/:imageName", handler.DeleteImage)
	// Static files
	g.Static("/uploads", uploadDir)
}
