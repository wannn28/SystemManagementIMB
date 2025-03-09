package server

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/route"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func StartServer() {
	cfg, err := config.LoadConfig()
	if err != nil {
		panic(err)
	}
	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))
	db, err := database.NewMySQLDB(&cfg)
	if err != nil {
		panic(err)
	}
	if err := os.MkdirAll(cfg.UploadDir, os.ModePerm); err != nil {
		panic(err)
	}
	// Initialize Repositories & Services
	projectRepo := repository.NewProjectRepository(db)
	projectService := service.NewProjectService(projectRepo)

	memberRepo := repository.NewMemberRepository(db)
	memberService := service.NewMemberService(memberRepo)

	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)

	kasbonRepo := repository.NewKasbonRepository(db)
	kasbonService := service.NewKasbonService(kasbonRepo)

	salaryDetailRepo := repository.NewSalaryDetailRepository(db)
	salaryDetailService := service.NewSalaryDetailService(salaryDetailRepo)

	salaryRepo := repository.NewSalaryRepository(db)
	salaryService := service.NewSalaryService(salaryRepo, memberRepo, salaryDetailService, kasbonService)

	// Register Routes
	route.RegisterProjectRoutes(e, projectService)
	route.RegisterMemberRoutes(e, memberService, salaryService, cfg, salaryDetailService, kasbonService)

	route.RegisterRoutes(e, userService)

	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
