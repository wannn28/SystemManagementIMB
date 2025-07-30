package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterApiKeyRoutes(e *echo.Echo, apiKeyService *service.ApiKeyService, config config.Config) {
	apiKeyHandler := http.NewApiKeyHandler(apiKeyService)

	// User protected routes for API key management
	userGroup := e.Group("/api/user")
	userGroup.Use(middleware.JWTAuthAnyRole([]string{"admin", "user"}, config))

	userGroup.GET("/api-key", apiKeyHandler.GetApiKey)
	userGroup.POST("/api-key", apiKeyHandler.UpsertApiKey)
	userGroup.DELETE("/api-key", apiKeyHandler.DeleteApiKey)
}
