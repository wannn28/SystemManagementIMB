package http

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"dashboardadminimb/utils"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt"
	"github.com/labstack/echo/v4"
)

type AuthHandler struct {
	userService          service.UserService
	passwordResetService service.PasswordResetService
	config               config.Config
}

func NewAuthHandler(userService service.UserService, passwordResetService service.PasswordResetService, config config.Config) *AuthHandler {
	return &AuthHandler{userService: userService, passwordResetService: passwordResetService, config: config}
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token"`
	NewPassword string `json:"new_password"`
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	user, err := h.userService.GetUserByEmail(req.Email)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, echo.ErrUnauthorized)
	}
	if strings.ToLower(strings.TrimSpace(user.Status)) != "active" {
		return response.Error(c, http.StatusForbidden, echo.NewHTTPError(http.StatusForbidden, "account pending"))
	}

	if err := utils.ComparePassword(user.Password, req.Password); err != nil {
		return response.Error(c, http.StatusUnauthorized, echo.ErrUnauthorized)
	}

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

// Register membuat akun baru dengan status "pending".
// POST /api/register
func (h *AuthHandler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Name == "" || req.Email == "" || req.Password == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "name, email, password are required"))
	}

	u := &entity.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
	}
	if err := h.userService.RegisterUserPending(u); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, map[string]interface{}{
		"id":     u.ID,
		"email":  u.Email,
		"status": u.Status,
	})
}

// ForgotPassword meminta reset token (untuk demo: token dikembalikan di response bila email ditemukan).
// POST /api/forgot-password
func (h *AuthHandler) ForgotPassword(c echo.Context) error {
	var req ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "email is required"))
	}
	token, err := h.passwordResetService.RequestReset(req.Email)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	// Jangan bocorkan user existence: selalu 200. Token dikirim jika ada.
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"message":     "if account exists, reset token generated",
		"reset_token": token,
	})
}

// ResetPassword mengganti password menggunakan reset token.
// POST /api/reset-password
func (h *AuthHandler) ResetPassword(c echo.Context) error {
	var req ResetPasswordRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if err := h.passwordResetService.ResetPassword(req.Token, req.NewPassword); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	return response.Success(c, http.StatusOK, map[string]string{"message": "password updated"})
}

