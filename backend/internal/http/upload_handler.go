package http

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"dashboardadminimb/pkg/response"
)

// UploadHandler handles generic file uploads (e.g. finance attachments).
type UploadHandler struct {
	uploadDir string
	baseURL   string
}

func NewUploadHandler(uploadDir, baseURL string) *UploadHandler {
	return &UploadHandler{uploadDir: uploadDir, baseURL: baseURL}
}

// allowedExtensions for finance attachments.
var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".pdf":  true,
	".doc":  true,
	".docx": true,
	".xls":  true,
	".xlsx": true,
}

// UploadFile accepts a multipart file (field name: "file"), saves it under
// <uploadDir>/finance/, and returns the public URL.
//
// POST /api/uploads/file
func (h *UploadHandler) UploadFile(c echo.Context) error {
	file, err := c.FormFile("file")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, fmt.Errorf("file required: %w", err))
	}

	// Validate extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExtensions[ext] {
		return response.Error(c, http.StatusBadRequest,
			fmt.Errorf("unsupported file type: %s", ext))
	}

	// Create subdirectory
	subDir := filepath.Join(h.uploadDir, "finance")
	if err := os.MkdirAll(subDir, os.ModePerm); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Unique filename
	fileName := uuid.New().String() + ext
	dstPath := filepath.Join(subDir, fileName)

	// Open source
	src, err := file.Open()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	defer src.Close()

	// Save to disk
	dst, err := os.Create(dstPath)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Build public URL: <baseURL>/api/uploads/finance/<filename>
	baseURL := strings.TrimRight(h.baseURL, "/")
	publicURL := fmt.Sprintf("%s/api/uploads/finance/%s", baseURL, fileName)

	return response.Success(c, http.StatusOK, map[string]string{
		"url":      publicURL,
		"filename": fileName,
	})
}
