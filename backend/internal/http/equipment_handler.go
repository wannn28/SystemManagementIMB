package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
)

type EquipmentHandler struct {
	service service.EquipmentService
}

func NewEquipmentHandler(service service.EquipmentService) *EquipmentHandler {
	return &EquipmentHandler{service: service}
}

func (h *EquipmentHandler) List(c echo.Context) error {
	search := c.QueryParam("q")
	typ := c.QueryParam("type") // alat_berat | dump_truck | empty = all
	list, err := h.service.GetAll(search, typ)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, list)
}

func (h *EquipmentHandler) GetByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	item, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, item)
}

func (h *EquipmentHandler) Create(c echo.Context) error {
	var body entity.Equipment
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if body.Name == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "name is required"))
	}
	if body.Type == "" {
		body.Type = "alat_berat"
	}
	if body.Type != "alat_berat" && body.Type != "dump_truck" {
		body.Type = "alat_berat"
	}
	if err := h.service.Create(&body); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, body)
}

func (h *EquipmentHandler) Update(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	existing, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var body entity.Equipment
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	existing.Name = body.Name
	if body.Type != "" {
		if body.Type == "alat_berat" || body.Type == "dump_truck" {
			existing.Type = body.Type
		}
	}
	if err := h.service.Update(existing); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, existing)
}

func (h *EquipmentHandler) Delete(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if _, err := h.service.GetByID(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.Delete(uint(id)); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}
