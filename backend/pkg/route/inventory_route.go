// Di pkg/route/inventory_route.go
package route

import (
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func RegisterInventoryRoutes(e *echo.Echo, service service.InventoryService, uploadDir string, baseURL string) {
	handler := http.NewInventoryHandler(service, uploadDir, baseURL)

	// Category routes
	e.GET("/api/inventory/categories", handler.GetAllCategories)
	e.POST("/api/inventory/categories", handler.CreateCategory)
	e.GET("/api/inventory/categories/:id", handler.GetCategory)
	e.PUT("/api/inventory/categories/:id", handler.UpdateCategory)
	e.DELETE("/api/inventory/categories/:id", handler.DeleteCategory)

	// Data routes
	e.GET("/api/inventory/categories/:categoryId/data", handler.GetCategoryData)
	e.POST("/api/inventory/categories/:categoryId/data", handler.CreateData)
	e.PUT("/api/inventory/data/:id", handler.UpdateData)
	e.DELETE("/api/inventory/data/:id", handler.DeleteData)

	// Upload route
	// e.POST("/api/inventory/upload", handler.UploadImage)
	e.POST("/api/inventory/data/:dataId/images", handler.UploadImage)
	e.DELETE("/api/inventory/data/:dataId/images/:imageName", handler.DeleteImage)
	// Static files
	e.Static("/uploads", uploadDir)
}
