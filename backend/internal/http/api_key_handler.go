// internal/http/api_key_handler.go
package http

import (
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"net/http"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

type ApiKeyHandler struct {
	apiKeyService *service.ApiKeyService
}

func NewApiKeyHandler(apiKeyService *service.ApiKeyService) *ApiKeyHandler {
	return &ApiKeyHandler{
		apiKeyService: apiKeyService,
	}
}

// GetApiKey retrieves API key for the authenticated user
func (h *ApiKeyHandler) GetApiKey(c echo.Context) error {
	// Get user ID from JWT claims
	userInterface := c.Get("user")
	if userInterface == nil {
		return response.Error(c, http.StatusUnauthorized, echo.NewHTTPError(http.StatusUnauthorized, "User not authenticated"))
	}

	claims, ok := userInterface.(*jwt.MapClaims)
	if !ok {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "Invalid user claims"))
	}

	userIDFloat, ok := (*claims)["id"].(float64)
	if !ok {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID in token"))
	}

	userID := uint(userIDFloat)

	apiKey, err := h.apiKeyService.GetApiKey(userID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, echo.NewHTTPError(http.StatusNotFound, "API key not found"))
	}

	// Return only the API key value, not the full entity
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"api_key": apiKey.ApiKey,
		"user_id": apiKey.UserID,
	})
}

// UpsertApiKey creates or updates API key for the authenticated user
func (h *ApiKeyHandler) UpsertApiKey(c echo.Context) error {
	// Get user ID from JWT claims
	userInterface := c.Get("user")
	if userInterface == nil {
		return response.Error(c, http.StatusUnauthorized, echo.NewHTTPError(http.StatusUnauthorized, "User not authenticated"))
	}

	claims, ok := userInterface.(*jwt.MapClaims)
	if !ok {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "Invalid user claims"))
	}

	userIDFloat, ok := (*claims)["id"].(float64)
	if !ok {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID in token"))
	}

	userID := uint(userIDFloat)

	var request struct {
		ApiKey string `json:"api_key"`
	}

	if err := c.Bind(&request); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	if request.ApiKey == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "API key cannot be empty"))
	}

	err := h.apiKeyService.UpsertApiKey(userID, request.ApiKey)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, map[string]interface{}{
		"message": "API key saved successfully",
		"user_id": userID,
	})
}

// DeleteApiKey deletes API key for the authenticated user
func (h *ApiKeyHandler) DeleteApiKey(c echo.Context) error {
	// Get user ID from JWT claims
	userInterface := c.Get("user")
	if userInterface == nil {
		return response.Error(c, http.StatusUnauthorized, echo.NewHTTPError(http.StatusUnauthorized, "User not authenticated"))
	}

	claims, ok := userInterface.(*jwt.MapClaims)
	if !ok {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "Invalid user claims"))
	}

	userIDFloat, ok := (*claims)["id"].(float64)
	if !ok {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID in token"))
	}

	userID := uint(userIDFloat)

	err := h.apiKeyService.DeleteApiKey(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, map[string]interface{}{
		"message": "API key deleted successfully",
		"user_id": userID,
	})
}
