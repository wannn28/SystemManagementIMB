// internal/http/activity_handler.go
package http

import (
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"net/http"

	"github.com/labstack/echo/v4"
)

type ActivityHandler struct {
	service service.ActivityService
}

func NewActivityHandler(service service.ActivityService) *ActivityHandler {
	return &ActivityHandler{service}
}

func (h *ActivityHandler) GetRecentActivities(c echo.Context) error {
	activities, err := h.service.GetRecentActivities(10) // Get last 10 activities
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, activities)
}
