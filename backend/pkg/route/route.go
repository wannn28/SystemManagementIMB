package route

import (
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, userService service.UserService) {
	userHandler := http.NewUserHandler(userService)
	e.POST("/users", userHandler.CreateUser)
	e.GET("/users", userHandler.GetAllUsers)
	e.GET("/users/:id", userHandler.GetUserByID)
	e.PUT("/users/:id", userHandler.UpdateUser)
	e.DELETE("/users/:id", userHandler.DeleteUser)
}
