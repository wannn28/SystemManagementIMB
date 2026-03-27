package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"dashboardadminimb/internal/service"
	"dashboardadminimb/pkg/response"

	"github.com/labstack/echo/v4"
	"gorm.io/datatypes"
)

type ExternalAPIHandler struct {
	projectService service.ProjectService
	financeService service.FinanceService
	memberService  service.MemberService
}

func NewExternalAPIHandler(projectService service.ProjectService, financeService service.FinanceService, memberService service.MemberService) *ExternalAPIHandler {
	return &ExternalAPIHandler{
		projectService: projectService,
		financeService: financeService,
		memberService:  memberService,
	}
}

// CutFillPushEntry is a single day's data pushed from Smart Nota.
type CutFillPushEntry struct {
	Date             string  `json:"date"`
	Ritase           float64 `json:"ritase"`
	Aktual           float64 `json:"aktual"`
	Cuaca            string  `json:"cuaca"`
	DisruptionHours  float64 `json:"disruption_hours"`
	Catatan          string  `json:"catatan"`
}

// CutFillPushRequest is the body for POST /api/external/daily-reports.
type CutFillPushRequest struct {
	ProjectID uint               `json:"project_id"`
	Entries   []CutFillPushEntry `json:"entries"`
}

func (h *ExternalAPIHandler) GetProjects(c echo.Context) error {
	data, err := h.projectService.GetAllProjects()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, data)
}

func (h *ExternalAPIHandler) GetFinance(c echo.Context) error {
	data, err := h.financeService.GetAllFinance()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, data)
}

func (h *ExternalAPIHandler) GetReports(c echo.Context) error {
	projects, err := h.projectService.GetAllProjects()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	out := make([]map[string]interface{}, 0, len(projects))
	for _, p := range projects {
		out = append(out, map[string]interface{}{
			"project_id": p.ID,
			"name":       p.Name,
			"reports":    p.Reports,
		})
	}
	return response.Success(c, http.StatusOK, out)
}

func (h *ExternalAPIHandler) GetTeam(c echo.Context) error {
	data, err := h.memberService.GetAllMembers()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, data)
}

// GetDailyReportsByProject returns the daily reports for a specific project.
// GET /api/external/daily-reports/:project_id
func (h *ExternalAPIHandler) GetDailyReportsByProject(c echo.Context) error {
	projectID, err := strconv.ParseUint(c.Param("project_id"), 10, 32)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("invalid project_id"))
	}
	project, err := h.projectService.GetProjectByID(uint(projectID))
	if err != nil {
		return response.Error(c, http.StatusNotFound, errors.New("project not found"))
	}
	var reports map[string]interface{}
	if len(project.Reports) > 0 {
		_ = json.Unmarshal(project.Reports, &reports)
	}
	if reports == nil {
		reports = map[string]interface{}{}
	}
	daily := reports["daily"]
	if daily == nil {
		daily = []interface{}{}
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"project_id": project.ID,
		"name":       project.Name,
		"daily":      daily,
	})
}

// PushCutFillReports receives cut-fill daily data from Smart Nota and merges it
// into the project's reports.daily JSON array.
// POST /api/external/daily-reports
func (h *ExternalAPIHandler) PushCutFillReports(c echo.Context) error {
	var req CutFillPushRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if req.ProjectID == 0 {
		return response.Error(c, http.StatusBadRequest, errors.New("project_id is required"))
	}
	if len(req.Entries) == 0 {
		return response.Error(c, http.StatusBadRequest, errors.New("entries must not be empty"))
	}

	project, err := h.projectService.GetProjectByID(req.ProjectID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, errors.New("project not found"))
	}

	// Parse existing reports blob.
	var reports map[string]interface{}
	if len(project.Reports) > 0 {
		_ = json.Unmarshal(project.Reports, &reports)
	}
	if reports == nil {
		reports = map[string]interface{}{}
	}

	// Load existing daily array into []map[string]interface{}.
	var daily []map[string]interface{}
	if d, ok := reports["daily"]; ok {
		if arr, ok := d.([]interface{}); ok {
			for _, item := range arr {
				if m, ok := item.(map[string]interface{}); ok {
					daily = append(daily, m)
				}
			}
		}
	}

	// Build a date → index map for fast lookup.
	dateIndex := make(map[string]int, len(daily))
	for i, dr := range daily {
		if date, ok := dr["date"].(string); ok {
			dateIndex[date] = i
		}
	}

	now := time.Now().Unix()
	updated, created := 0, 0
	for _, e := range req.Entries {
		catatan := e.Catatan
		if e.DisruptionHours > 0 {
			if catatan != "" {
				catatan += " | "
			}
			catatan += "Jam gangguan: " + strconv.FormatFloat(e.DisruptionHours, 'f', -1, 64) + " jam"
		}

		if idx, exists := dateIndex[e.Date]; exists {
			daily[idx]["ritase"] = e.Ritase
			daily[idx]["aktual"] = e.Aktual
			if e.Cuaca != "" {
				daily[idx]["cuaca"] = e.Cuaca
			}
			if catatan != "" {
				daily[idx]["catatan"] = catatan
			}
			daily[idx]["updatedAt"] = now
			updated++
		} else {
			newEntry := map[string]interface{}{
				"id":             0,
				"projectId":      req.ProjectID,
				"date":           e.Date,
				"revenue":        0,
				"paid":           0,
				"volume":         0,
				"targetVolume":   0,
				"plan":           0,
				"aktual":         e.Aktual,
				"ritase":         e.Ritase,
				"cuaca":          e.Cuaca,
				"catatan":        catatan,
				"workers":        map[string]interface{}{},
				"equipment":      map[string]interface{}{},
				"totalWorkers":   0,
				"totalEquipment": 0,
				"images":         []interface{}{},
				"createdAt":      now,
				"updatedAt":      now,
			}
			dateIndex[e.Date] = len(daily)
			daily = append(daily, newEntry)
			created++
		}
	}

	reports["daily"] = daily
	if reports["weekly"] == nil {
		reports["weekly"] = []interface{}{}
	}
	if reports["monthly"] == nil {
		reports["monthly"] = []interface{}{}
	}

	reportsJSON, err := json.Marshal(reports)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	project.Reports = datatypes.JSON(reportsJSON)

	if err := h.projectService.UpdateProject(project); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, map[string]interface{}{
		"project_id": req.ProjectID,
		"updated":    updated,
		"created":    created,
	})
}

