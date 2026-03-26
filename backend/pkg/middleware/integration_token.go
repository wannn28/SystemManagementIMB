package middleware

import (
	"net/http"
	"strings"

	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func IntegrationTokenAuth(tokenService service.IntegrationAPITokenService, requiredScope string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			raw := c.Request().Header.Get("X-Integration-Token")
			if raw == "" {
				auth := c.Request().Header.Get("Authorization")
				if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
					raw = strings.TrimSpace(auth[7:])
				}
			}
			token, scopes, err := tokenService.ValidateToken(raw, requiredScope)
			if err != nil {
				msg := err.Error()
				code := http.StatusUnauthorized
				if strings.Contains(msg, "scope") {
					code = http.StatusForbidden
				}
				return echo.NewHTTPError(code, msg)
			}
			c.Set("integration_token", token)
			c.Set("integration_scopes", scopes)
			return next(c)
		}
	}
}

