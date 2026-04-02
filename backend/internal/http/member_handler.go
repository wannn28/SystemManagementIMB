package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
	appmiddleware "dashboardadminimb/pkg/middleware"
	"dashboardadminimb/pkg/response"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/datatypes"
)

type MemberHandler struct {
	service         service.MemberService
	salaryService   service.SalaryService
	uploadDir       string
	activityService service.ActivityService
}

func NewMemberHandler(service service.MemberService, salaryService service.SalaryService, uploadDir string, activityService service.ActivityService) *MemberHandler {
	return &MemberHandler{
		service:         service,
		salaryService:   salaryService,
		uploadDir:       uploadDir,
		activityService: activityService,
	}
}

func (h *MemberHandler) GetMemberCount(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	count, err := h.service.GetMemberCount(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]int64{"count": count})
}

func (h *MemberHandler) GetAllMembersWithPagination(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	params := response.ParseQueryParams(c)
	members, total, err := h.service.GetAllMembersWithPagination(params, userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, members, pagination)
}

func (h *MemberHandler) CreateMember(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	var member entity.Member

	contentType := c.Request().Header.Get("Content-Type")
	if contentType != "" && len(contentType) >= 19 && contentType[:19] == "multipart/form-data" {
		dataStr := c.FormValue("data")
		if dataStr == "" {
			return response.Error(c, http.StatusBadRequest, errors.New("data field is required"))
		}
		if err := json.Unmarshal([]byte(dataStr), &member); err != nil {
			return response.Error(c, http.StatusBadRequest, fmt.Errorf("invalid JSON data: %v", err))
		}
		file, err := c.FormFile("file")
		if err == nil && file != nil {
			fileExt := filepath.Ext(file.Filename)
			fileName := uuid.New().String() + fileExt
			dstPath := filepath.Join(h.uploadDir, fileName)
			if err := h.saveUploadedFile(file, dstPath); err != nil {
				return response.Error(c, http.StatusInternalServerError, fmt.Errorf("failed to save file: %v", err))
			}
			member.ProfileImage = fileName
		} else {
			member.ProfileImage = ""
		}
	} else {
		if err := c.Bind(&member); err != nil {
			return response.Error(c, http.StatusBadRequest, err)
		}
		member.ProfileImage = ""
	}

	member.ID = uuid.New().String()
	if member.Documents == nil || len(member.Documents) == 0 {
		member.Documents = datatypes.JSON("[]")
	}
	if member.Files == nil || len(member.Files) == 0 {
		member.Files = datatypes.JSON("[]")
	}

	if err := h.service.CreateMember(userID, &member); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityMember, "Member Baru",
		fmt.Sprintf("%s bergabung sebagai %s", member.FullName, member.Role))
	return response.Success(c, http.StatusCreated, member)
}

func (h *MemberHandler) UpdateMember(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id := c.Param("id")
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := c.Bind(member); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if err := h.service.UpdateMember(member); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityMember, "Update Member",
		fmt.Sprintf("berhasil update member %s", member.FullName))
	return response.Success(c, http.StatusOK, member)
}

func (h *MemberHandler) GetAllMembers(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	members, err := h.service.GetAllMembers(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, members)
}

func (h *MemberHandler) GetMemberByID(c echo.Context) error {
	id := c.Param("id")
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	baseURL := os.Getenv("BASE_URL") + "/uploads/"
	responseData := struct {
		*entity.Member
		ProfileURL   string   `json:"profileUrl"`
		DocumentURLs []string `json:"documentUrls"`
		FileURLs     []string `json:"fileUrls"`
	}{
		Member:     member,
		ProfileURL: baseURL + member.ProfileImage,
	}
	var documentNames []string
	json.Unmarshal(member.Documents, &documentNames)
	for _, docName := range documentNames {
		responseData.DocumentURLs = append(responseData.DocumentURLs, baseURL+docName)
	}
	var fileNames []string
	json.Unmarshal(member.Files, &fileNames)
	for _, fileName := range fileNames {
		responseData.FileURLs = append(responseData.FileURLs, baseURL+fileName)
	}
	return response.Success(c, http.StatusOK, responseData)
}

func (h *MemberHandler) DeleteMember(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id := c.Param("id")
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.salaryService.DeleteAllByMemberID(id); err != nil {
		return response.Error(c, http.StatusInternalServerError, fmt.Errorf("gagal menghapus data gaji member: %w", err))
	}
	if err := h.service.DeleteMember(id); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	_ = h.activityService.LogActivity(userID, entity.ActivityMember, "Delete Member",
		fmt.Sprintf("berhasil Delete member %s", member.FullName))
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *MemberHandler) UploadProfileImage(c echo.Context) error {
	id := c.Param("id")
	file, err := c.FormFile("file")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	fileExt := filepath.Ext(file.Filename)
	fileName := uuid.New().String() + fileExt
	dstPath := filepath.Join(h.uploadDir, fileName)
	if err := h.saveUploadedFile(file, dstPath); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if member.ProfileImage != "" {
		os.Remove(filepath.Join(h.uploadDir, member.ProfileImage))
	}
	member.ProfileImage = fileName
	return h.service.UpdateMember(member)
}

func (h *MemberHandler) saveUploadedFile(file *multipart.FileHeader, dstPath string) error {
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()
	if err := os.MkdirAll(h.uploadDir, os.ModePerm); err != nil {
		return err
	}
	dst, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dst.Close()
	_, err = io.Copy(dst, src)
	return err
}

func (h *MemberHandler) AddDocument(c echo.Context) error {
	id := c.Param("id")
	form, err := c.MultipartForm()
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	files := form.File["files"]
	if len(files) == 0 {
		return response.Error(c, http.StatusBadRequest, errors.New("no files uploaded"))
	}
	var fileNames []string
	for _, file := range files {
		fileExt := filepath.Ext(file.Filename)
		fileName := uuid.New().String() + fileExt
		dstPath := filepath.Join(h.uploadDir, fileName)
		if err := h.saveUploadedFile(file, dstPath); err != nil {
			return response.Error(c, http.StatusInternalServerError, err)
		}
		fileNames = append(fileNames, fileName)
	}
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var documents []string
	json.Unmarshal(member.Documents, &documents)
	documents = append(documents, fileNames...)
	documentsJSON, _ := json.Marshal(documents)
	member.Documents = documentsJSON
	return h.service.UpdateMember(member)
}

func (h *MemberHandler) DeleteDocument(c echo.Context) error {
	id := c.Param("id")
	fileName := c.Param("fileName")
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var documents []string
	json.Unmarshal(member.Documents, &documents)
	newDocs := make([]string, 0)
	for _, doc := range documents {
		if doc != fileName {
			newDocs = append(newDocs, doc)
		}
	}
	documentsJSON, _ := json.Marshal(newDocs)
	member.Documents = documentsJSON
	os.Remove(filepath.Join(h.uploadDir, fileName))
	return h.service.UpdateMember(member)
}

func (h *MemberHandler) DeactivateMember(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id := c.Param("id")
	var req struct {
		Reason string `json:"reason"`
	}
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if req.Reason == "" {
		return response.Error(c, http.StatusBadRequest, errors.New("reason is required"))
	}
	if err := h.service.DeactivateMember(id, req.Reason); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	member, _ := h.service.GetMemberByID(id)
	_ = h.activityService.LogActivity(userID, entity.ActivityUpdate, "Member Dinonaktifkan",
		fmt.Sprintf("Member %s dinonaktifkan. Alasan: %s", member.FullName, req.Reason))
	return response.Success(c, http.StatusOK, map[string]string{"message": "Member deactivated successfully"})
}

func (h *MemberHandler) ActivateMember(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	id := c.Param("id")
	if err := h.service.ActivateMember(id); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	member, _ := h.service.GetMemberByID(id)
	_ = h.activityService.LogActivity(userID, entity.ActivityUpdate, "Member Diaktifkan",
		fmt.Sprintf("Member %s diaktifkan kembali", member.FullName))
	return response.Success(c, http.StatusOK, map[string]string{"message": "Member activated successfully"})
}

func (h *MemberHandler) GetMemberTotalSalary(c echo.Context) error {
	memberID := c.Param("id")
	total, err := h.service.GetMemberTotalSalary(memberID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"member_id":    memberID,
		"total_salary": total,
	})
}

func (h *MemberHandler) GetAllMembersTotalSalary(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	total, err := h.service.GetAllMembersTotalSalary(userID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"total_salary": total,
	})
}

func (h *MemberHandler) GetMemberTotalSalaryWithFilter(c echo.Context) error {
	memberID := c.Param("id")
	year := c.QueryParam("year")
	month := c.QueryParam("month")
	total, err := h.service.GetMemberTotalSalaryWithFilter(memberID, year, month)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"member_id":    memberID,
		"year":         year,
		"month":        month,
		"total_salary": total,
	})
}

func (h *MemberHandler) GetAllMembersTotalSalaryWithFilter(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	year := c.QueryParam("year")
	month := c.QueryParam("month")
	total, err := h.service.GetAllMembersTotalSalaryWithFilter(userID, year, month)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"year":         year,
		"month":        month,
		"total_salary": total,
	})
}

func (h *MemberHandler) GetAllMembersWithSalaryInfo(c echo.Context) error {
	userID, err := appmiddleware.CurrentUserID(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, err)
	}
	year := c.QueryParam("year")
	month := c.QueryParam("month")
	orderBy := c.QueryParam("order")
	if orderBy != "asc" && orderBy != "desc" {
		orderBy = "desc"
	}
	members, err := h.service.GetAllMembersWithSalaryInfo(userID, year, month, orderBy)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, members)
}

func (h *MemberHandler) GetMemberMonthlySalaryDetails(c echo.Context) error {
	memberID := c.Param("id")
	year := c.QueryParam("year")
	details, err := h.service.GetMemberMonthlySalaryDetails(memberID, year)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, details)
}
