package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, userService service.UserService, config config.Config) {
	authHandler := http.NewAuthHandler(userService, config)
	userHandler := http.NewUserHandler(userService)

	// Public routes
	e.POST("/api/login", authHandler.Login)

	// Admin protected routes
	adminGroup := e.Group("/api/admin")
	adminGroup.Use(middleware.AdminAuth(config))

	adminGroup.POST("/users", userHandler.CreateUser)
	adminGroup.GET("/users", userHandler.GetAllUsers)
	adminGroup.GET("/users/:id", userHandler.GetUserByID)
	adminGroup.PUT("/users/:id", userHandler.UpdateUser)
	adminGroup.DELETE("/users/:id", userHandler.DeleteUser)
}
