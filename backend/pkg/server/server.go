package server

import (
	"dashboardadminimb/config" // Import dengan alias
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/route"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
)

func StartServer() {
	cfg, err := config.LoadConfig()
	if err != nil {
		panic(err)
	}
	e := echo.New()
	e.Use(echoMiddleware.CORSWithConfig(echoMiddleware.CORSConfig{
		AllowOrigins: []string{
			"*",
		},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization,
			"X-Requested-With",
		},
		AllowCredentials: true,
		MaxAge:           86400, // 24 hours
	}))

	db, err := database.NewMySQLDB(&cfg)
	if err != nil {
		panic(err)
	}
	if err := os.MkdirAll(cfg.UploadDir, os.ModePerm); err != nil {
		panic(err)
	}

	e.Use(echoMiddleware.Logger())
	e.Use(echoMiddleware.Recover())

	// Inisialisasi user service terlebih dahulu
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)

	// Inisialisasi API key service
	apiKeyRepo := repository.NewApiKeyRepository(db)
	apiKeyService := service.NewApiKeyService(apiKeyRepo)

	// Inisialisasi service lainnya
	projectRepo := repository.NewProjectRepository(db)
	projectService := service.NewProjectService(projectRepo)

	memberRepo := repository.NewMemberRepository(db)
	memberService := service.NewMemberService(memberRepo)

	activityRepo := repository.NewActivityRepository(db)
	activityService := service.NewActivityService(activityRepo)

	kasbonRepo := repository.NewKasbonRepository(db)
	kasbonService := service.NewKasbonService(kasbonRepo)

	salaryDetailRepo := repository.NewSalaryDetailRepository(db)
	salaryDetailService := service.NewSalaryDetailService(salaryDetailRepo)

	salaryRepo := repository.NewSalaryRepository(db)
	salaryService := service.NewSalaryService(salaryRepo, memberRepo, salaryDetailService, kasbonService)

	// Registrasi route
	route.RegisterProjectRoutes(e, projectService, cfg, activityService)
	route.RegisterMemberRoutes(e, memberService, salaryService, cfg, salaryDetailService, kasbonService, activityService) // Perbaiki typo

	financeRepo := repository.NewFinanceRepository(db)
	financeService := service.NewFinanceService(financeRepo)
	financeCategoryRepo := repository.NewFinanceCategoryRepository(db)
	financeCategoryService := service.NewFinanceCategoryService(financeCategoryRepo)

	inventoryRepo := repository.NewInventoryRepository(db)
	inventoryService := service.NewInventoryService(inventoryRepo)
	route.RegisterInventoryRoutes(e, inventoryService, cfg.UploadDir, cfg.BaseURL, cfg, activityService)

	route.RegisterFinanceRoutes(e, financeService, cfg, activityService, financeCategoryService)
	route.RegisterRoutes(e, userService, cfg)
	route.RegisterApiKeyRoutes(e, apiKeyService, cfg)

	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
