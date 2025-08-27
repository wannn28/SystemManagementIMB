package route

import (
	"dashboardadminimb/internal/http"

	"github.com/labstack/echo/v4"
)

func SetupDailyReportRoutes(e *echo.Echo, handler *http.DailyReportHandler) {
	dailyReports := e.Group("/api/daily-reports")

	// Daily report routes
	dailyReports.POST("", handler.CreateDailyReport)
	dailyReports.GET("/project/:projectId", handler.GetDailyReportsByProject)
	dailyReports.GET("/:id", handler.GetDailyReportByID)
	dailyReports.PUT("/:id", handler.UpdateDailyReport)
	dailyReports.DELETE("/:id", handler.DeleteDailyReport)
	dailyReports.GET("/project/:projectId/range", handler.GetDailyReportsByDateRange)
}
