package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	appmiddleware "dashboardadminimb/pkg/middleware"
	"dashboardadminimb/pkg/response"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/datatypes"
)

type InventoryHandler struct {
	service         service.InventoryService
	uploadDir       string
	baseURL         string
	activityService service.ActivityService
}

type InventoryDataResponse struct {
	ID         string         `json:"id"`
	CategoryID string         `json:"category_id"`
	Values     datatypes.JSON `json:"values"`
	Images     []string       `json:"images"`
}

type InventoryHeader struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	Optional bool   `json:"optional"`
}

func NewInventoryHandler(service service.InventoryService, uploadDir string, baseURL string, activityService service.ActivityService) *InventoryHandler {
	return &InventoryHandler{
		service:         service,
		uploadDir:       uploadDir,
		baseURL:         baseURL,
		activityService: activityService,
	}
}

func (h *InventoryHandler) CreateCategory(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	var category entity.InventoryCategory
	if err := c.Bind(&category); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if err := h.service.CreateCategory(userID, &category); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityIncome, "Create Category Baru",
		fmt.Sprintf("Berhasil membuat category baru dengan judul: %s", category.Title))
	return response.Success(c, http.StatusCreated, category)
}

func (h *InventoryHandler) GetAllCategories(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	categories, err := h.service.GetAllCategories(userID)
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
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id := c.Param("id")
	var category entity.InventoryCategory
	if err := c.Bind(&category); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	category.ID = id
	if err := h.service.UpdateCategory(&category); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityUpdate, "Berhasil mengupdate category",
		fmt.Sprintf("Berhasil mengupdate category dengan judul: %s", category.Title))
	return response.Success(c, http.StatusOK, category)
}

func (h *InventoryHandler) DeleteCategory(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id := c.Param("id")
	category, err := h.service.GetCategoryByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.DeleteCategory(id); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityExpense, "Berhasil menghapus category",
		fmt.Sprintf("Berhasil menghapus category dengan judul: %s", category.Title))
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *InventoryHandler) CreateData(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	categoryID := c.Param("categoryId")
	var data entity.InventoryData
	if err := c.Bind(&data); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	data.CategoryID = categoryID
	category, err := h.service.GetCategoryByID(categoryID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var headers []InventoryHeader
	if err := json.Unmarshal(category.Headers, &headers); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
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
	index := len(category.Data)
	data.ID = h.service.GenerateDataID(category.Title, dataName, index)
	if err := h.service.CreateData(&data); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityIncome, "Create Data Baru",
		fmt.Sprintf("Berhasil membuat Data baru dengan category : %s", category.Title))
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
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id := c.Param("id")
	var data entity.InventoryData
	if err := c.Bind(&data); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	data.ID = id
	if err := h.service.UpdateData(&data); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	category, err := h.service.GetCategoryByID(data.CategoryID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityUpdate, "Update Data",
		fmt.Sprintf("Berhasil Update Data di category : %s", category.Title))
	return response.Success(c, http.StatusOK, data)
}

func (h *InventoryHandler) DeleteData(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id := c.Param("id")
	data, err := h.service.GetDataByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	category, err := h.service.GetCategoryByID(data.CategoryID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.DeleteData(id); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityExpense, "Berhasil menghapus data",
		fmt.Sprintf("Berhasil menghapus data di category : %s", category.Title))
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *InventoryHandler) UploadImage(c echo.Context) error {
	dataID := c.Param("dataId")
	data, err := h.service.GetDataByID(dataID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	file, err := c.FormFile("file")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	filename := uuid.New().String() + filepath.Ext(file.Filename)
	dst := filepath.Join(h.uploadDir, filename)
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

func (h *InventoryHandler) DeleteImage(c echo.Context) error {
	dataID := c.Param("dataId")
	imageName := c.Param("imageName")
	data, err := h.service.GetDataByID(dataID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
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
	if err := h.service.UpdateData(data); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	filePath := filepath.Join(h.uploadDir, imageName)
	if err := os.Remove(filePath); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, nil)
}
