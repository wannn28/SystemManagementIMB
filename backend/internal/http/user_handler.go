package http

import (
	"net/http"
	"strconv"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"

	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	service service.UserService
}

func NewUserHandler(service service.UserService) *UserHandler {
	return &UserHandler{service}
}

func (h *UserHandler) CreateUser(c echo.Context) error {
	var user entity.User
	if err := c.Bind(&user); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	if err := h.service.CreateUser(&user); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusCreated, user)
}

func (h *UserHandler) GetAllUsers(c echo.Context) error {
	users, err := h.service.GetAllUsers()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, users)
}

func (h *UserHandler) GetAllUsersWithPagination(c echo.Context) error {
	params := response.ParseQueryParams(c)
	users, total, err := h.service.GetAllUsersWithPagination(params)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, users, pagination)
}

func (h *UserHandler) GetUserByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	user, err := h.service.GetUserByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, user)
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))

	var user entity.User
	if err := c.Bind(&user); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	user.ID = uint(id)
	if err := h.service.UpdateUser(&user); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, user)
}

func (h *UserHandler) DeleteUser(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.DeleteUser(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}
