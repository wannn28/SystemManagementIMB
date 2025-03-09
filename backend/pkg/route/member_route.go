package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func RegisterMemberRoutes(e *echo.Echo, memberService service.MemberService, salaryService service.SalaryService, config config.Config, DetailService service.SalaryDetailService, kasbonService service.KasbonService) {
	handler := http.NewMemberHandler(memberService, "uploads")
	salaryHandler := http.NewSalaryHandler(salaryService, config.UploadDir, DetailService)
	kasbonHandler := http.NewKasbonHandler(kasbonService, salaryService)

	// Member Routes
	e.POST("/members", handler.CreateMember)
	e.POST("/members/:id/profile", handler.UploadProfileImage)
	e.POST("/members/:id/documents", handler.AddDocument)
	e.DELETE("/members/:id/documents/:fileName", handler.DeleteDocument)
	e.GET("/members", handler.GetAllMembers)
	e.GET("/members/:id", handler.GetMemberByID)
	e.PUT("/members/:id", handler.UpdateMember)
	e.DELETE("/members/:id", handler.DeleteMember)

	// Salary Routes under Member
	e.POST("/members/:id/salaries", salaryHandler.CreateSalary)
	e.GET("/members/:id/salaries", salaryHandler.GetSalaries)
	e.PUT("/members/:id/salaries/:salaryId", salaryHandler.UpdateSalary)
	e.DELETE("/members/:id/salaries/:salaryId", salaryHandler.DeleteSalary)

	// Salary Document Routes
	e.POST("/salaries/:id/documents", salaryHandler.UploadDocuments)
	e.DELETE("/salaries/:id/documents/:fileName", salaryHandler.DeleteDocument)

	// Serve uploaded files
	e.GET("/uploads/*", func(c echo.Context) error {
		filePath := c.Param("*")
		staticDir := "uploads/"
		fullPath := staticDir + filePath
		return c.File(fullPath)
	})

	// Salary Detail Routes
	e.POST("/salaries/:id/details", salaryHandler.CreateSalaryDetail)
	e.PUT("/salaries/:id/details/:detailId", salaryHandler.UpdateSalaryDetail)
	e.DELETE("/salaries/:id/details/:detailId", salaryHandler.DeleteSalaryDetail)
	e.GET("/salaries/:id/details", salaryHandler.GetSalaryDetail)

	e.POST("/salaries/:salaryId/kasbons", kasbonHandler.CreateKasbon)
	e.GET("/salaries/:salaryId/kasbons", kasbonHandler.GetKasbonsBySalary)
	e.PUT("/kasbons/:id", kasbonHandler.UpdateKasbon)
	e.DELETE("/kasbons/:id", kasbonHandler.DeleteKasbon)
}
