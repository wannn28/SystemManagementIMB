package server

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/entity"
	internalhttp "dashboardadminimb/internal/http"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/database"
	appmiddleware "dashboardadminimb/pkg/middleware"
	"dashboardadminimb/pkg/route"
	nethttp "net/http"
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
		AllowMethods: []string{nethttp.MethodGet, nethttp.MethodPost, nethttp.MethodPut, nethttp.MethodDelete, nethttp.MethodOptions},
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization,
			"X-Integration-Token",
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
	integrationTokenRepo := repository.NewIntegrationAPITokenRepository(db)
	integrationTokenService := service.NewIntegrationAPITokenService(integrationTokenRepo)

	// Inisialisasi service lainnya
	projectRepo := repository.NewProjectRepository(db)
	projectService := service.NewProjectService(projectRepo)

	projectExpenseRepo := repository.NewProjectExpenseRepository(db)
	projectIncomeRepo := repository.NewProjectIncomeRepository(db)
	projectExpenseService := service.NewProjectExpenseService(projectExpenseRepo, projectIncomeRepo)
	projectIncomeService := service.NewProjectIncomeService(projectIncomeRepo)

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

	// Initialize finance service first (needed by project routes)
	financeRepo := repository.NewFinanceRepository(db)
	financeService := service.NewFinanceService(financeRepo)

	// Registrasi route
	route.RegisterProjectRoutes(e, projectService, cfg, activityService)
	route.RegisterProjectExpenseRoutes(e, projectExpenseService, activityService, financeService, projectService, cfg)
	route.RegisterProjectIncomeRoutes(e, projectIncomeService, activityService, financeService, projectService, cfg)

	// Project share links (persisted + public view/edit)
	projectShareLinkRepo := repository.NewProjectShareLinkRepository(db)
	projectShareLinkService := service.NewProjectShareLinkService(projectShareLinkRepo)
	projectShareLinkHandler := internalhttp.NewProjectShareLinkHandler(projectShareLinkService, projectService)
	// Protected: create link
	projectsGroup := e.Group("/api/projects")
	projectsGroup.Use(appmiddleware.AdminAuth(cfg))
	projectsGroup.POST("/:id/share-links", projectShareLinkHandler.Create)
	// Public: view + edit settings by token
	publicGroup := e.Group("/api/public/projects")
	publicGroup.GET("/shared/:token", projectShareLinkHandler.GetSharedProject)
	publicGroup.PUT("/shared/:token", projectShareLinkHandler.UpdateSharedSettings)
	publicGroup.PUT("/shared/:token/reports", projectShareLinkHandler.UpdateSharedReports)

	route.RegisterMemberRoutes(e, memberService, salaryService, cfg, salaryDetailService, kasbonService, activityService) // Perbaiki typo
	financeCategoryRepo := repository.NewFinanceCategoryRepository(db)
	financeCategoryService := service.NewFinanceCategoryService(financeCategoryRepo)

	inventoryRepo := repository.NewInventoryRepository(db)
	inventoryService := service.NewInventoryService(inventoryRepo)
	route.RegisterInventoryRoutes(e, inventoryService, cfg.UploadDir, cfg.BaseURL, cfg, activityService)

	route.RegisterFinanceRoutes(e, financeService, cfg, activityService, financeCategoryService, projectIncomeService, projectExpenseService)

	invoiceTemplateRepo := repository.NewInvoiceTemplateRepository(db)
	invoiceTemplateService := service.NewInvoiceTemplateService(invoiceTemplateRepo)
	// Seed default templates if none exist
	if list, _ := invoiceTemplateRepo.FindAll(); len(list) == 0 {
		for _, t := range []struct{ name, desc, layout string }{
			{"Standard", "Template invoice sederhana dengan header dan tabel item", "standard"},
			{"Minimal", "Template minimal, cocok untuk nota cepat", "minimal"},
			{"Professional", "Template formal dengan ruang logo dan footer", "professional"},
		} {
			_ = invoiceTemplateRepo.Create(&entity.InvoiceTemplate{Name: t.name, Description: t.desc, Layout: t.layout})
		}
	}
	invoiceRepo := repository.NewInvoiceRepository(db)
	invoiceService := service.NewInvoiceService(invoiceRepo)
	route.RegisterInvoiceRoutes(e, cfg, invoiceTemplateService, invoiceService)

	customerRepo := repository.NewCustomerRepository(db)
	customerService := service.NewCustomerService(customerRepo)
	route.RegisterCustomerRoutes(e, cfg, customerService)

	equipmentRepo := repository.NewEquipmentRepository(db)
	equipmentService := service.NewEquipmentService(equipmentRepo)
	route.RegisterEquipmentRoutes(e, cfg, equipmentService)

	itemTemplateRepo := repository.NewItemTemplateRepository(db)
	itemTemplateService := service.NewItemTemplateService(itemTemplateRepo)
	route.RegisterItemTemplateRoutes(e, cfg, itemTemplateService)

	route.RegisterRoutes(e, userService, cfg)
	route.RegisterApiKeyRoutes(e, apiKeyService, cfg)
	route.RegisterIntegrationAPITokenRoutes(e, integrationTokenService, cfg)
	route.RegisterExternalAPIRoutes(e, integrationTokenService, projectService, financeService, memberService)
	route.RegisterActivityRoutes(e, activityService, cfg)

	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
