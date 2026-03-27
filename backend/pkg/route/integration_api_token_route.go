package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterIntegrationAPITokenRoutes(e *echo.Echo, tokenService service.IntegrationAPITokenService, cfg config.Config) {
	h := http.NewIntegrationAPITokenHandler(tokenService)
	g := e.Group("/api/user/integration-tokens")
	g.Use(middleware.JWTAuthAnyRole([]string{"admin", "user"}, cfg))

	g.GET("", h.List)
	g.POST("", h.Create)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
	g.POST("/:id/regenerate", h.Regenerate)
}

