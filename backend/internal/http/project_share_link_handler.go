package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"

	"github.com/labstack/echo/v4"
	"gorm.io/datatypes"
)

type ProjectShareLinkHandler struct {
	shareService   service.ProjectShareLinkService
	projectService service.ProjectService
}

func NewProjectShareLinkHandler(shareService service.ProjectShareLinkService, projectService service.ProjectService) *ProjectShareLinkHandler {
	return &ProjectShareLinkHandler{shareService: shareService, projectService: projectService}
}

// Create share link (admin/auth required)
// POST /api/projects/:id/share-links
func (h *ProjectShareLinkHandler) Create(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	var req struct {
		Settings json.RawMessage `json:"settings"`
	}
	_ = c.Bind(&req)

	link, err := h.shareService.Create(uint(id), req.Settings)
	if err != nil {
		// bisa error validasi (400) atau error DB (lebih tepat 500)
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, link)
}

// Get shared project + settings (public)
// GET /api/public/projects/shared/:token
func (h *ProjectShareLinkHandler) GetSharedProject(c echo.Context) error {
	token := c.Param("token")
	link, err := h.shareService.GetByToken(token)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	project, err := h.projectService.GetProjectByID(link.ProjectID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"project":  project,
		"settings": json.RawMessage(link.Settings),
		"token":    link.Token,
	})
}

// Update settings (public but requires edit_token)
// PUT /api/public/projects/shared/:token
func (h *ProjectShareLinkHandler) UpdateSharedSettings(c echo.Context) error {
	token := c.Param("token")
	editToken := c.QueryParam("edit_token")
	var req struct {
		Settings json.RawMessage `json:"settings"`
	}
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	link, err := h.shareService.UpdateSettings(token, editToken, req.Settings)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"settings": json.RawMessage(link.Settings),
	})
}

// UpdateSharedReports menyimpan project.reports (daily/weekly/monthly).
// PUT /api/public/projects/shared/:token/reports?edit_token=...
// Akses diizinkan jika:
// - edit_token valid, atau
// - settings.allowEdit == true (link view boleh edit rekapitulasi).
func (h *ProjectShareLinkHandler) UpdateSharedReports(c echo.Context) error {
	token := c.Param("token")
	editToken := c.QueryParam("edit_token")
	var req struct {
		Reports json.RawMessage `json:"reports"`
	}
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if len(req.Reports) == 0 {
		return response.Error(c, http.StatusBadRequest, errors.New("reports is required"))
	}
	link, err := h.shareService.GetByToken(token)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	allowEdit := false
	var settingsMap map[string]interface{}
	if err := json.Unmarshal([]byte(link.Settings), &settingsMap); err == nil {
		if v, ok := settingsMap["allowEdit"].(bool); ok {
			allowEdit = v
		}
	}
	if link.EditToken != editToken && !allowEdit {
		return response.Error(c, http.StatusForbidden, errors.New("edit is not allowed"))
	}
	project, err := h.projectService.GetProjectByID(link.ProjectID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	project.Reports = datatypes.JSON(req.Reports)
	if err := h.projectService.UpdateProject(project); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	updated, err := h.projectService.GetProjectByID(link.ProjectID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"project": updated,
	})
}

