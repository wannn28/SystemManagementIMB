package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type ItemTemplateHandler struct {
	service service.ItemTemplateService
}

func NewItemTemplateHandler(service service.ItemTemplateService) *ItemTemplateHandler {
	return &ItemTemplateHandler{service: service}
}

func (h *ItemTemplateHandler) List(c echo.Context) error {
	search := c.QueryParam("q")
	list, err := h.service.GetAll(search)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, list)
}

func (h *ItemTemplateHandler) GetByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	item, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, item)
}

func (h *ItemTemplateHandler) Create(c echo.Context) error {
	var body entity.ItemTemplate
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if body.Name == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "name is required"))
	}
	if err := h.service.Create(&body); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, body)
}

func (h *ItemTemplateHandler) Update(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	existing, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var body entity.ItemTemplate
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	existing.Name = body.Name
	if err := h.service.Update(existing); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, existing)
}

func (h *ItemTemplateHandler) Delete(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if _, err := h.service.GetByID(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.Delete(uint(id)); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}
