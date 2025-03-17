package route

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/http"
	"dashboardadminimb/internal/service"

	"github.com/labstack/echo/v4"
)

func RegisterMemberRoutes(g *echo.Echo, memberService service.MemberService, salaryService service.SalaryService, config config.Config, DetailService service.SalaryDetailService, kasbonService service.KasbonService) {
	handler := http.NewMemberHandler(memberService, "uploads")
	salaryHandler := http.NewSalaryHandler(salaryService, config.UploadDir, DetailService)
	kasbonHandler := http.NewKasbonHandler(kasbonService, salaryService)

	// Member Routes
	g.POST("/members", handler.CreateMember)
	g.POST("/members/:id/profile", handler.UploadProfileImage)
	g.POST("/members/:id/documents", handler.AddDocument)
	g.DELETE("/members/:id/documents/:fileName", handler.DeleteDocument)
	g.GET("/members", handler.GetAllMembers)
	g.GET("/members/:id", handler.GetMemberByID)
	g.PUT("/members/:id", handler.UpdateMember)
	g.DELETE("/members/:id", handler.DeleteMember)

	// Salary Routes under Member
	g.POST("/members/:id/salaries", salaryHandler.CreateSalary)
	g.GET("/members/:id/salaries", salaryHandler.GetSalaries)
	g.PUT("/members/:id/salaries/:salaryId", salaryHandler.UpdateSalary)
	g.DELETE("/members/:id/salaries/:salaryId", salaryHandler.DeleteSalary)

	// Salary Document Routes
	g.POST("/salaries/:id/documents", salaryHandler.UploadDocuments)
	g.DELETE("/salaries/:id/documents/:fileName", salaryHandler.DeleteDocument)

	// Serve uploaded files
	g.GET("/uploads/*", func(c echo.Context) error {
		filePath := c.Param("*")
		staticDir := "uploads/"
		fullPath := staticDir + filePath
		return c.File(fullPath)
	})

	// Salary Detail Routes
	g.POST("/salaries/:id/details", salaryHandler.CreateSalaryDetail)
	g.PUT("/salaries/:id/details/:detailId", salaryHandler.UpdateSalaryDetail)
	g.DELETE("/salaries/:id/details/:detailId", salaryHandler.DeleteSalaryDetail)
	g.GET("/salaries/:id/details", salaryHandler.GetSalaryDetail)

	g.POST("/salaries/:salaryId/kasbons", kasbonHandler.CreateKasbon)
	g.GET("/salaries/:salaryId/kasbons", kasbonHandler.GetKasbonsBySalary)
	g.PUT("/kasbons/:id", kasbonHandler.UpdateKasbon)
	g.DELETE("/kasbons/:id", kasbonHandler.DeleteKasbon)
}
