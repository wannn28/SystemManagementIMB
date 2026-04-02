package middleware

import (
	"net/http"

	"dashboardadminimb/internal/entity"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

// CurrentUserID extracts the authenticated user's ID from the JWT claims stored
// in the Echo context by AdminAuth / JWTAuthAnyRole middleware.
func CurrentUserID(c echo.Context) (uint, error) {
	userInterface := c.Get("user")
	claims, ok := userInterface.(*jwt.MapClaims)
	if !ok {
		return 0, echo.NewHTTPError(http.StatusUnauthorized, "invalid user claims")
	}
	idFloat, ok := (*claims)["id"].(float64)
	if !ok {
		return 0, echo.NewHTTPError(http.StatusUnauthorized, "invalid user id in token")
	}
	return uint(idFloat), nil
}

// IntegrationTokenUserID extracts the user_id from an integration token stored
// in the Echo context by IntegrationTokenAuth middleware.
func IntegrationTokenUserID(c echo.Context) (uint, error) {
	tokenInterface := c.Get("integration_token")
	token, ok := tokenInterface.(*entity.IntegrationAPIToken)
	if !ok || token == nil {
		return 0, echo.NewHTTPError(http.StatusUnauthorized, "invalid integration token")
	}
	return token.UserID, nil
}
