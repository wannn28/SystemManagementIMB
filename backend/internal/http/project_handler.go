package http

import (
	"fmt"
	"net/http"
	"strconv"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	appmiddleware "dashboardadminimb/pkg/middleware"
	"dashboardadminimb/pkg/response"

	"github.com/labstack/echo/v4"
)

type ProjectHandler struct {
	service         service.ProjectService
	activityService service.ActivityService
}

func NewProjectHandler(service service.ProjectService, activityService service.ActivityService) *ProjectHandler {
	return &ProjectHandler{service, activityService}
}

func (h *ProjectHandler) CreateProject(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}

	var project entity.Project
	if err := c.Bind(&project); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	if err := h.service.CreateProject(userID, &project); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityIncome, "Proyek Baru",
		fmt.Sprintf("Proyek %s dimulai", project.Name))
	return response.Success(c, http.StatusCreated, project)
}

func (h *ProjectHandler) GetAllProjects(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	projects, err := h.service.GetAllProjects(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, projects)
}

func (h *ProjectHandler) GetAllProjectsWithPagination(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	params := response.ParseQueryParams(c)
	projects, total, err := h.service.GetAllProjectsWithPagination(params, userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, projects, pagination)
}

func (h *ProjectHandler) GetProjectByID(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, _ := strconv.Atoi(c.Param("id"))
	project, err := h.service.GetProjectByID(uint(id), userID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, project)
}

func (h *ProjectHandler) UpdateProject(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, _ := strconv.Atoi(c.Param("id"))

	var project entity.Project
	if err := c.Bind(&project); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	project.ID = uint(id)
	project.UserID = userID
	if err := h.service.UpdateProject(&project); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityUpdate, "Update Project",
		fmt.Sprintf("Update Project : %s", project.Name))
	return response.Success(c, http.StatusOK, project)
}

func (h *ProjectHandler) DeleteProject(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id, _ := strconv.Atoi(c.Param("id"))
	project, err := h.service.GetProjectByID(uint(id), userID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.DeleteProject(uint(id), userID); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityExpense, "Delete Project",
		fmt.Sprintf("Delete Project : %s", project.Name))
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *ProjectHandler) GetProjectCount(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	count, err := h.service.GetProjectCount(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]int64{"count": count})
}
