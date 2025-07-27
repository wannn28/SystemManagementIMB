package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/middleware"

	"github.com/labstack/echo/v4"
)

func RegisterMemberRoutes(e *echo.Echo, memberService service.MemberService, salaryService service.SalaryService, config config.Config, DetailService service.SalaryDetailService, kasbonService service.KasbonService, activityService service.ActivityService) {
	handler := http.NewMemberHandler(memberService, "uploads", activityService)
	salaryHandler := http.NewSalaryHandler(salaryService, memberService, config.UploadDir, DetailService, activityService)
	kasbonHandler := http.NewKasbonHandler(kasbonService, salaryService, activityService)
	activityHandler := http.NewActivityHandler(activityService)
	g := e.Group("/api/members")
	a := e.Group("/api/activities")
	j := e.Group("/api/uploads")
	h := e.Group("/api/salaries")
	i := e.Group("/api/kasbons")

	a.Use(middleware.AdminAuth(config))
	g.Use(middleware.AdminAuth(config))
	h.Use(middleware.AdminAuth(config))
	i.Use(middleware.AdminAuth(config))
	// j.Use(middleware.AdminAuth(config))
	// Member Routes
	a.GET("", activityHandler.GetRecentActivities)
	g.POST("", handler.CreateMember)
	g.POST("/:id/profile", handler.UploadProfileImage)
	g.POST("/:id/documents", handler.AddDocument)
	g.DELETE("/:id/documents/:fileName", handler.DeleteDocument)
	g.GET("", handler.GetAllMembers)
	g.GET("/paginated", handler.GetAllMembersWithPagination)
	g.GET("/count", handler.GetMemberCount)
	g.GET("/:id", handler.GetMemberByID)
	g.PUT("/:id", handler.UpdateMember)
	g.DELETE("/:id", handler.DeleteMember)

	// Salary Routes under Member
	g.POST("/:id/salaries", salaryHandler.CreateSalary)
	g.GET("/:id/salaries", salaryHandler.GetSalaries)
	g.GET("/salaries/paginated", salaryHandler.GetAllSalariesWithPagination)
	g.PUT("/:id/salaries/:salaryId", salaryHandler.UpdateSalary)
	g.DELETE("/:id/salaries/:salaryId", salaryHandler.DeleteSalary)

	// Salary Document Routes
	h.POST("/:id/documents", salaryHandler.UploadDocuments)
	h.DELETE("/:id/documents/:fileName", salaryHandler.DeleteDocument)

	// Serve uploaded files
	j.GET("/*", func(c echo.Context) error {
		filePath := c.Param("*")
		staticDir := "uploads/"
		fullPath := staticDir + filePath
		return c.File(fullPath)
	})

	// Salary Detail Routes
	h.POST("/:id/details", salaryHandler.CreateSalaryDetail)
	h.PUT("/:id/details/:detailId", salaryHandler.UpdateSalaryDetail)
	h.DELETE("/:id/details/:detailId", salaryHandler.DeleteSalaryDetail)
	h.GET("/:id/details", salaryHandler.GetSalaryDetail)

	h.POST("/:salaryId/kasbons", kasbonHandler.CreateKasbon)
	h.GET("/:salaryId/kasbons", kasbonHandler.GetKasbonsBySalary)
	h.GET("/kasbons/paginated", kasbonHandler.GetAllKasbonsWithPagination)

	i.PUT("/:id", kasbonHandler.UpdateKasbon)
	i.DELETE("/:id", kasbonHandler.DeleteKasbon)

	// Activity Routes
	a.GET("", activityHandler.GetRecentActivities)
	a.GET("/paginated", activityHandler.GetAllActivitiesWithPagination)
}
