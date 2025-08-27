package http

import (
	"dashboardadminimb/internal/service"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
)

type FinanceCategoryHandler struct {
	service service.FinanceCategoryService
}

func NewFinanceCategoryHandler(s service.FinanceCategoryService) *FinanceCategoryHandler {
	return &FinanceCategoryHandler{service: s}
}

type createCategoryReq struct {
	Name string `json:"name"`
}

func (h *FinanceCategoryHandler) Create(c echo.Context) error {
	var req createCategoryReq
	if err := c.Bind(&req); err != nil || req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]any{"message": "invalid request"})
	}
	item, err := h.service.Create(req.Name)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]any{"message": err.Error()})
	}
	return c.JSON(http.StatusCreated, map[string]any{"data": item})
}

func (h *FinanceCategoryHandler) Update(c echo.Context) error {
	idParam := c.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]any{"message": "invalid id"})
	}
	var req createCategoryReq
	if err := c.Bind(&req); err != nil || req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]any{"message": "invalid request"})
	}
	item, err := h.service.Update(id, req.Name)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]any{"message": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]any{"data": item})
}

func (h *FinanceCategoryHandler) Delete(c echo.Context) error {
	idParam := c.Param("id")
	var id uint
	if _, err := fmt.Sscanf(idParam, "%d", &id); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]any{"message": "invalid id"})
	}
	if err := h.service.Delete(id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]any{"message": err.Error()})
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *FinanceCategoryHandler) List(c echo.Context) error {
	items, err := h.service.List()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]any{"message": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]any{"data": items})
}
