package route

import (
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func RegisterProjectRoutes(e *echo.Echo, projectService service.ProjectService) {
	handler := http.NewProjectHandler(projectService)
	e.POST("/projects", handler.CreateProject)
	e.GET("/projects", handler.GetAllProjects)
	e.GET("/projects/:id", handler.GetProjectByID)
	e.PUT("/projects/:id", handler.UpdateProject)
	e.DELETE("/projects/:id", handler.DeleteProject)
}
