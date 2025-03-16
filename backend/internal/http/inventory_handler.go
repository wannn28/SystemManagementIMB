package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/datatypes"
)

type InventoryHandler struct {
	service   service.InventoryService
	uploadDir string
	baseURL   string
}
type InventoryDataResponse struct {
	ID         string         `json:"id"`
	CategoryID string         `json:"category_id"`
	Values     datatypes.JSON `json:"values"`
	Images     []string       `json:"images"` // Berisi URL lengkap
}

// Tambahkan struct untuk Header
type InventoryHeader struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	Optional bool   `json:"optional"`
}

func NewInventoryHandler(service service.InventoryService, uploadDir string, baseURL string) *InventoryHandler {
	return &InventoryHandler{
		service:   service,
		uploadDir: uploadDir,
		baseURL:   baseURL,
	}
}

// Category Handlers
func (h *InventoryHandler) CreateCategory(c echo.Context) error {
	var category entity.InventoryCategory
	if err := c.Bind(&category); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	if err := h.service.CreateCategory(&category); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusCreated, category)
}

func (h *InventoryHandler) GetAllCategories(c echo.Context) error {
	categories, err := h.service.GetAllCategories()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, categories)
}

func (h *InventoryHandler) GetCategory(c echo.Context) error {
	id := c.Param("id")
	category, err := h.service.GetCategoryByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, category)
}

func (h *InventoryHandler) UpdateCategory(c echo.Context) error {
	id := c.Param("id")

	var category entity.InventoryCategory
	if err := c.Bind(&category); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	category.ID = id

	if err := h.service.UpdateCategory(&category); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, category)
}

func (h *InventoryHandler) DeleteCategory(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.DeleteCategory(id); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}

// Data Handlers
func (h *InventoryHandler) CreateData(c echo.Context) error {
	categoryID := c.Param("categoryId")

	var data entity.InventoryData
	if err := c.Bind(&data); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	data.CategoryID = categoryID

	// Get category to generate ID
	category, err := h.service.GetCategoryByID(categoryID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	// Unmarshal headers
	var headers []InventoryHeader
	if err := json.Unmarshal(category.Headers, &headers); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Get data name from values
	var values map[string]interface{}
	json.Unmarshal(data.Values, &values)
	dataName := ""
	for _, header := range headers {
		if header.Type == "string" {
			if val, ok := values[header.ID]; ok {
				dataName = val.(string)
				break
			}
		}
	}

	// Generate ID
	index := len(category.Data)
	data.ID = h.service.GenerateDataID(category.Title, dataName, index)

	if err := h.service.CreateData(&data); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusCreated, data)
}
func (h *InventoryHandler) GetCategoryData(c echo.Context) error {
	categoryID := c.Param("categoryId")
	data, err := h.service.GetDataByCategory(categoryID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	responseData := make([]InventoryDataResponse, 0)
	for _, d := range data {
		var images []string
		json.Unmarshal(d.Images, &images)

		fullUrls := make([]string, 0)
		for _, img := range images {
			fullUrls = append(fullUrls, h.baseURL+"/uploads/"+img)
		}

		responseData = append(responseData, InventoryDataResponse{
			ID:         d.ID,
			CategoryID: d.CategoryID,
			Values:     d.Values,
			Images:     fullUrls,
		})
	}

	return response.Success(c, http.StatusOK, responseData)
}

func (h *InventoryHandler) UpdateData(c echo.Context) error {
	id := c.Param("id")

	var data entity.InventoryData
	if err := c.Bind(&data); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	data.ID = id

	if err := h.service.UpdateData(&data); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, data)
}

func (h *InventoryHandler) DeleteData(c echo.Context) error {
	id := c.Param("id")
	if err := h.service.DeleteData(id); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}

// Upload Handler
func (h *InventoryHandler) UploadImage(c echo.Context) error {
	dataID := c.Param("dataId")

	// Dapatkan data inventory
	data, err := h.service.GetDataByID(dataID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	file, err := c.FormFile("file")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// Generate filename
	filename := uuid.New().String() + filepath.Ext(file.Filename)
	dst := filepath.Join(h.uploadDir, filename)

	// Simpan file
	src, err := file.Open()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	defer src.Close()

	if err := os.MkdirAll(h.uploadDir, os.ModePerm); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	dstFile, err := os.Create(dst)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	defer dstFile.Close()

	if _, err = io.Copy(dstFile, src); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Update data images
	var images []string
	json.Unmarshal(data.Images, &images)
	images = append(images, filename)
	imagesJSON, _ := json.Marshal(images)
	data.Images = imagesJSON

	if err := h.service.UpdateData(data); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, map[string]string{
		"url": h.baseURL + "/uploads/" + filename,
	})
}

// internal/http/inventory_handler.go
func (h *InventoryHandler) DeleteImage(c echo.Context) error {
	dataID := c.Param("dataId")
	imageName := c.Param("imageName")

	// Dapatkan data
	data, err := h.service.GetDataByID(dataID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	// Update images list
	var images []string
	json.Unmarshal(data.Images, &images)

	newImages := make([]string, 0)
	for _, img := range images {
		if img != imageName {
			newImages = append(newImages, img)
		}
	}

	imagesJSON, _ := json.Marshal(newImages)
	data.Images = imagesJSON

	// Update data
	if err := h.service.UpdateData(data); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Hapus file
	filePath := filepath.Join(h.uploadDir, imageName)
	if err := os.Remove(filePath); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, nil)
}
