package http

import (
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

type IntegrationAPITokenHandler struct {
	service service.IntegrationAPITokenService
}

func NewIntegrationAPITokenHandler(service service.IntegrationAPITokenService) *IntegrationAPITokenHandler {
	return &IntegrationAPITokenHandler{service: service}
}

func currentUserID(c echo.Context) (uint, error) {
	userInterface := c.Get("user")
	claims, ok := userInterface.(*jwt.MapClaims)
	if !ok {
		return 0, echo.NewHTTPError(http.StatusUnauthorized, "invalid user claims")
	}
	idFloat, ok := (*claims)["id"].(float64)
	if !ok {
		return 0, echo.NewHTTPError(http.StatusUnauthorized, "invalid user id")
	}
	return uint(idFloat), nil
}

func (h *IntegrationAPITokenHandler) Create(c echo.Context) error {
	userID, err := currentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	var req struct {
		Name   string          `json:"name"`
		Scopes map[string]bool `json:"scopes"`
	}
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	row, raw, err := h.service.CreateToken(userID, req.Name, req.Scopes)
	if err != nil {
		msg := strings.ToLower(err.Error())
		if errors.Is(err, echo.ErrNotFound) || strings.Contains(msg, "required") || strings.Contains(msg, "invalid") {
			return response.Error(c, http.StatusBadRequest, err)
		}
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, map[string]interface{}{
		"id":           row.ID,
		"name":         row.Name,
		"token":        raw,
		"token_prefix": row.TokenPrefix,
		"scopes":       req.Scopes,
		"is_active":    row.IsActive,
		"created_at":   row.CreatedAt,
	})
}

func (h *IntegrationAPITokenHandler) List(c echo.Context) error {
	userID, err := currentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	rows, err := h.service.ListTokens(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, rows)
}

func (h *IntegrationAPITokenHandler) Update(c echo.Context) error {
	userID, err := currentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id64, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var req struct {
		Name     string          `json:"name"`
		Scopes   map[string]bool `json:"scopes"`
		IsActive bool            `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	row, err := h.service.UpdateToken(userID, uint(id64), req.Name, req.Scopes, req.IsActive)
	if err != nil {
		msg := strings.ToLower(err.Error())
		if errors.Is(err, echo.ErrNotFound) || strings.Contains(msg, "required") || strings.Contains(msg, "invalid") {
			return response.Error(c, http.StatusBadRequest, err)
		}
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, row)
}

func (h *IntegrationAPITokenHandler) Delete(c echo.Context) error {
	userID, err := currentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id64, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	if err := h.service.DeleteToken(userID, uint(id64)); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]string{"message": "token deleted"})
}

func (h *IntegrationAPITokenHandler) Regenerate(c echo.Context) error {
	userID, err := currentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id64, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	row, raw, err := h.service.RegenerateToken(userID, uint(id64))
	if err != nil {
		msg := strings.ToLower(err.Error())
		if strings.Contains(msg, "not found") {
			return response.Error(c, http.StatusNotFound, err)
		}
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"id":           row.ID,
		"name":         row.Name,
		"token":        raw,
		"token_prefix": row.TokenPrefix,
		"is_active":    row.IsActive,
	})
}

