package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterProjectRoutes(e *echo.Echo, projectService service.ProjectService, config config.Config, activityService service.ActivityService) {
	handler := http.NewProjectHandler(projectService, activityService)
	g := e.Group("/api/projects")
	g.Use(middleware.AdminAuth(config))

	g.POST("", handler.CreateProject)
	g.GET("", handler.GetAllProjects)
	g.GET("/paginated", handler.GetAllProjectsWithPagination)
	g.GET("/:id", handler.GetProjectByID)
	g.GET("/count", handler.GetProjectCount)
	g.PUT("/:id", handler.UpdateProject)
	g.DELETE("/:id", handler.DeleteProject)
}
