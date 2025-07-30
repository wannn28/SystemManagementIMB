package middleware

import (
	"dashboardadminimb/config"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

func JWTAuth(role string, config config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "Missing authorization header")
			}

			tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
			token, err := jwt.ParseWithClaims(tokenString, &jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
				return []byte(config.JWTSecret), nil
			})

			if err != nil || !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid token")
			}

			claims, ok := token.Claims.(*jwt.MapClaims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid token claims")
			}

			userRole := (*claims)["role"].(string)
			if userRole != role {
				return echo.NewHTTPError(http.StatusForbidden, "Insufficient permissions")
			}

			c.Set("user", claims)
			return next(c)
		}
	}
}

// JWTAuthAnyRole accepts any of the provided roles
func JWTAuthAnyRole(roles []string, config config.Config) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "Missing authorization header")
			}

			tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
			token, err := jwt.ParseWithClaims(tokenString, &jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
				return []byte(config.JWTSecret), nil
			})

			if err != nil || !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid token")
			}

			claims, ok := token.Claims.(*jwt.MapClaims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "Invalid token claims")
			}

			userRole := (*claims)["role"].(string)
			roleAllowed := false
			for _, role := range roles {
				if userRole == role {
					roleAllowed = true
					break
				}
			}

			if !roleAllowed {
				return echo.NewHTTPError(http.StatusForbidden, "Insufficient permissions")
			}

			c.Set("user", claims)
			return next(c)
		}
	}
}

func AdminAuth(config config.Config) echo.MiddlewareFunc {
	return JWTAuth("admin", config)
}
