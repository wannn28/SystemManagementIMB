package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterProjectRoutes(e *echo.Echo, projectService service.ProjectService, config config.Config) {
	handler := http.NewProjectHandler(projectService)
	g := e.Group("/projects")
	g.Use(middleware.AdminAuth(config))

	g.POST("", handler.CreateProject)
	g.GET("", handler.GetAllProjects)
	g.GET("/:id", handler.GetProjectByID)
	g.PUT("/:id", handler.UpdateProject)
	g.DELETE("/:id", handler.DeleteProject)
}
