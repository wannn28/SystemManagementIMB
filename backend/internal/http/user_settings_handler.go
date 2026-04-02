package http

import (
	"dashboardadminimb/internal/service"
	appmiddleware "dashboardadminimb/pkg/middleware"
	"dashboardadminimb/pkg/response"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

type UserSettingsHandler struct {
	userService service.UserService
	uploadDir   string
	baseURL     string
}

func NewUserSettingsHandler(userService service.UserService, uploadDir, baseURL string) *UserSettingsHandler {
	return &UserSettingsHandler{userService: userService, uploadDir: uploadDir, baseURL: baseURL}
}

type UpdateCompanySettingsRequest struct {
	CompanyName  string `json:"company_name"`
	PrimaryColor string `json:"primary_color"`
}

func (h *UserSettingsHandler) GetSettings(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"company_name":  user.CompanyName,
		"company_logo":  user.CompanyLogo,
		"primary_color": user.PrimaryColor,
		"name":          user.Name,
		"email":         user.Email,
	})
}

func (h *UserSettingsHandler) UpdateSettings(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	var req UpdateCompanySettingsRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	if req.CompanyName != "" {
		user.CompanyName = req.CompanyName
	}
	if req.PrimaryColor != "" {
		user.PrimaryColor = req.PrimaryColor
	}

	if err := h.userService.UpdateUser(user); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"company_name":  user.CompanyName,
		"company_logo":  user.CompanyLogo,
		"primary_color": user.PrimaryColor,
	})
}

func (h *UserSettingsHandler) UploadLogo(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}

	file, err := c.FormFile("logo")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, fmt.Errorf("logo file required"))
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true, ".svg": true}
	if !allowed[ext] {
		return response.Error(c, http.StatusBadRequest, fmt.Errorf("file type not allowed"))
	}

	src, err := file.Open()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	defer src.Close()

	logoDir := filepath.Join(h.uploadDir, "logos")
	if err := os.MkdirAll(logoDir, os.ModePerm); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	filename := fmt.Sprintf("logo_%d_%d%s", userID, time.Now().UnixNano(), ext)
	dstPath := filepath.Join(logoDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Store relative path so frontend can construct the correct URL
	logoURL := fmt.Sprintf("/uploads/logos/%s", filename)

	user, err := h.userService.GetUserByID(userID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	user.CompanyLogo = logoURL
	if err := h.userService.UpdateUser(user); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, map[string]string{
		"company_logo": logoURL,
	})
}
