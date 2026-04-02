package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, userService service.UserService, passwordResetService service.PasswordResetService, config config.Config) {
	authHandler := http.NewAuthHandler(userService, passwordResetService, config)
	userHandler := http.NewUserHandler(userService)
	userSettingsHandler := http.NewUserSettingsHandler(userService, config.UploadDir, config.BaseURL)

	// Public routes
	e.POST("/api/login", authHandler.Login)
	e.POST("/api/register", authHandler.Register)
	e.POST("/api/forgot-password", authHandler.ForgotPassword)
	e.POST("/api/reset-password", authHandler.ResetPassword)

	// Authenticated user settings routes
	userGroup := e.Group("/api/user")
	userGroup.Use(middleware.AdminAuth(config))
	userGroup.GET("/settings", userSettingsHandler.GetSettings)
	userGroup.PUT("/settings", userSettingsHandler.UpdateSettings)
	userGroup.POST("/settings/logo", userSettingsHandler.UploadLogo)

	// Admin protected routes
	adminGroup := e.Group("/api/admin")
	adminGroup.Use(middleware.AdminAuth(config))

	adminGroup.POST("/users", userHandler.CreateUser)
	adminGroup.GET("/users", userHandler.GetAllUsers)
	adminGroup.GET("/users/paginated", userHandler.GetAllUsersWithPagination)
	adminGroup.GET("/users/:id", userHandler.GetUserByID)
	adminGroup.PUT("/users/:id", userHandler.UpdateUser)
	adminGroup.DELETE("/users/:id", userHandler.DeleteUser)
}
