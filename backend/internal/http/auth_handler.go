package http

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	userService service.UserService
	config      config.Config
}

func NewAuthHandler(userService service.UserService, config config.Config) *AuthHandler {
	return &AuthHandler{userService, config}
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, echo.ErrUnauthorized)
	}

	// Implement password validation logic here
	// if !checkPasswordHash(req.Password, user.Password) {
	//     return response.Error(c, http.StatusUnauthorized, echo.ErrUnauthorized)
	// }

	claims := &jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 72).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	t, err := token.SignedString([]byte(h.config.JWTSecret))
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return c.JSON(http.StatusOK, map[string]string{
		"token": t,
	})
}
