package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterActivityRoutes(e *echo.Echo, activityService service.ActivityService, config config.Config) {
	handler := http.NewActivityHandler(activityService)
	g := e.Group("/api/activities")
	g.Use(middleware.AdminAuth(config))

	// Get recent activities (default 10)
	g.GET("", handler.GetRecentActivities)

	// Get all activities with pagination
	g.GET("/paginated", handler.GetAllActivitiesWithPagination)
}
