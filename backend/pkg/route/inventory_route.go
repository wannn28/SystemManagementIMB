// Di pkg/route/inventory_route.go
package route

import (
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func RegisterInventoryRoutes(g *echo.Echo, service service.InventoryService, uploadDir string, baseURL string) {
	handler := http.NewInventoryHandler(service, uploadDir, baseURL)

	// Category routes
	g.GET("/api/inventory/categories", handler.GetAllCategories)
	g.POST("/api/inventory/categories", handler.CreateCategory)
	g.GET("/api/inventory/categories/:id", handler.GetCategory)
	g.PUT("/api/inventory/categories/:id", handler.UpdateCategory)
	g.DELETE("/api/inventory/categories/:id", handler.DeleteCategory)

	// Data routes
	g.GET("/api/inventory/categories/:categoryId/data", handler.GetCategoryData)
	g.POST("/api/inventory/categories/:categoryId/data", handler.CreateData)
	g.PUT("/api/inventory/data/:id", handler.UpdateData)
	g.DELETE("/api/inventory/data/:id", handler.DeleteData)

	// Upload route
	// g.POST("/api/inventory/upload", handler.UploadImage)
	g.POST("/api/inventory/data/:dataId/images", handler.UploadImage)
	g.DELETE("/api/inventory/data/:dataId/images/:imageName", handler.DeleteImage)
	// Static files
	g.Static("/uploads", uploadDir)
}
