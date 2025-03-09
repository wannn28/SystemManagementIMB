package http

import (
	"fmt"
	"net/http"
	"strconv"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"

	"github.com/labstack/echo/v4"
)

type ProjectHandler struct {
	service service.ProjectService
}

func NewProjectHandler(service service.ProjectService) *ProjectHandler {
	return &ProjectHandler{service}
}

func (h *ProjectHandler) CreateProject(c echo.Context) error {
	var project entity.Project
	if err := c.Bind(&project); err != nil {
		fmt.Println("Error binding project:", err) // Log error binding
		return response.Error(c, http.StatusBadRequest, err)
	}

	fmt.Printf("Received project data: %+v\n", project) // Log data yang diterima

	if err := h.service.CreateProject(&project); err != nil {
		fmt.Println("Error creating project:", err) // Log error dari service
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusCreated, project)
}

func (h *ProjectHandler) GetAllProjects(c echo.Context) error {
	projects, err := h.service.GetAllProjects()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, projects)
}

func (h *ProjectHandler) GetProjectByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	project, err := h.service.GetProjectByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, project)
}

func (h *ProjectHandler) UpdateProject(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))

	var project entity.Project
	if err := c.Bind(&project); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	project.ID = uint(id)
	if err := h.service.UpdateProject(&project); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, project)
}

func (h *ProjectHandler) DeleteProject(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.DeleteProject(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}
