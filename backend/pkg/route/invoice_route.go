package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterInvoiceRoutes(e *echo.Echo, cfg config.Config, templateService service.InvoiceTemplateService, invoiceService service.InvoiceService) {
	templateHandler := http.NewInvoiceTemplateHandler(templateService)
	invoiceHandler := http.NewInvoiceHandler(invoiceService)

	g := e.Group("/api/invoices")
	g.Use(middleware.AdminAuth(cfg))

	// Templates
	g.GET("/templates", templateHandler.List)
	g.GET("/templates/:id", templateHandler.GetByID)
	g.POST("/templates", templateHandler.Create)
	g.PUT("/templates/:id", templateHandler.Update)
	g.DELETE("/templates/:id", templateHandler.Delete)

	// Invoices
	g.GET("", invoiceHandler.GetAllWithPagination)
	g.GET("/customer-suggestions", invoiceHandler.GetCustomerSuggestions)
	g.GET("/:id", invoiceHandler.GetByID)
	g.POST("", invoiceHandler.Create)
	g.PUT("/:id", invoiceHandler.Update)
	g.DELETE("/:id", invoiceHandler.Delete)
}
