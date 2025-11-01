package http

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/service"
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
	uploadDir       string
	activityService service.ActivityService
}

func NewMemberHandler(service service.MemberService, uploadDir string, activityService service.ActivityService) *MemberHandler {
	return &MemberHandler{
		service:         service,
		uploadDir:       uploadDir,
		activityService: activityService, // Add this line
	}
}
func (h *MemberHandler) GetMemberCount(c echo.Context) error {
	count, err := h.service.GetMemberCount()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, map[string]int64{"count": count})
}

func (h *MemberHandler) GetAllMembersWithPagination(c echo.Context) error {
	params := response.ParseQueryParams(c)
	members, total, err := h.service.GetAllMembersWithPagination(params)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, members, pagination)
}

func (h *MemberHandler) CreateMember(c echo.Context) error {
	var member entity.Member

	// Check if request is multipart form data
	contentType := c.Request().Header.Get("Content-Type")
	if contentType != "" && len(contentType) >= 19 && contentType[:19] == "multipart/form-data" {
		// Handle multipart form data (with file upload)
		dataStr := c.FormValue("data")
		if dataStr == "" {
			return response.Error(c, http.StatusBadRequest, errors.New("data field is required"))
		}

		// Parse JSON data
		if err := json.Unmarshal([]byte(dataStr), &member); err != nil {
			return response.Error(c, http.StatusBadRequest, fmt.Errorf("invalid JSON data: %v", err))
		}

		// Handle profile image upload if provided
		file, err := c.FormFile("file")
		if err == nil && file != nil {
			// Generate nama file unik
			fileExt := filepath.Ext(file.Filename)
			fileName := uuid.New().String() + fileExt
			dstPath := filepath.Join(h.uploadDir, fileName)

			// Simpan file
			if err := h.saveUploadedFile(file, dstPath); err != nil {
				return response.Error(c, http.StatusInternalServerError, fmt.Errorf("failed to save file: %v", err))
			}
			member.ProfileImage = fileName
		} else {
			member.ProfileImage = ""
		}
	} else {
		// Handle regular JSON request
		if err := c.Bind(&member); err != nil {
			return response.Error(c, http.StatusBadRequest, err)
		}
		member.ProfileImage = ""
	}

	// Generate ID
	member.ID = uuid.New().String()

	// Inisialisasi nilai default
	if member.ProfileImage == "" {
		member.ProfileImage = ""
	}
	if member.Documents == nil || len(member.Documents) == 0 {
		member.Documents = datatypes.JSON("[]")
	}
	if member.Files == nil || len(member.Files) == 0 {
		member.Files = datatypes.JSON("[]")
	}

	if err := h.service.CreateMember(&member); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	// Log activity
	err := h.activityService.LogActivity(
		entity.ActivityMember,
		"Member Baru",
		fmt.Sprintf("%s bergabung sebagai %s", member.FullName, member.Role),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, http.StatusCreated, member)
}

func (h *MemberHandler) UpdateMember(c echo.Context) error {
	id := c.Param("id")
	// Dapatkan member yang akan diupdate
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	// Bind request body ke member
	if err := c.Bind(member); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// Update member
	if err := h.service.UpdateMember(member); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	err = h.activityService.LogActivity(
		entity.ActivityMember,
		"Update Member",
		fmt.Sprintf("berhasil update member %s", member.FullName),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, http.StatusOK, member)
}

func (h *MemberHandler) GetAllMembers(c echo.Context) error {
	members, err := h.service.GetAllMembers()
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
	// ambil dari env
	baseURL := os.Getenv("BASE_URL") + "/uploads/"

	// Konversi ke response object dengan URL lengkap
	responseData := struct {
		*entity.Member
		ProfileURL   string   `json:"profileUrl"`
		DocumentURLs []string `json:"documentUrls"`
		FileURLs     []string `json:"fileUrls"`
	}{
		Member: member,

		ProfileURL: baseURL + member.ProfileImage,
	}

	// Ambil nama-nama file dan konversi ke URL
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
	id := c.Param("id")
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.DeleteMember(id); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	err = h.activityService.LogActivity(
		entity.ActivityMember,
		"Delete Member",
		fmt.Sprintf("berhasil Delete member %s", member.FullName),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}

// Endpoint untuk upload gambar profil
func (h *MemberHandler) UploadProfileImage(c echo.Context) error {
	id := c.Param("id")

	// Ambil file dengan key "file"
	file, err := c.FormFile("file")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	// Generate nama file unik
	fileExt := filepath.Ext(file.Filename)
	fileName := uuid.New().String() + fileExt
	dstPath := filepath.Join(h.uploadDir, fileName)

	// Simpan file
	if err := h.saveUploadedFile(file, dstPath); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	// Update member
	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	// Hapus file lama jika ada
	if member.ProfileImage != "" {
		os.Remove(filepath.Join(h.uploadDir, member.ProfileImage))
	}

	member.ProfileImage = fileName
	return h.service.UpdateMember(member)
}

// Fungsi utilitas untuk menyimpan file
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

// Tambah dokumen
func (h *MemberHandler) AddDocument(c echo.Context) error {
	id := c.Param("id")
	form, err := c.MultipartForm()
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	files := form.File["files"] // Ambil semua file dengan key "files"
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
		fileNames = append(fileNames, fileName) // Simpan hanya nama file, bukan path lengkap
	}

	// Update array documents
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

// Hapus dokumen
func (h *MemberHandler) DeleteDocument(c echo.Context) error {
	id := c.Param("id")
	fileName := c.Param("fileName")

	member, err := h.service.GetMemberByID(id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	// Hapus dari array
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

	// Hapus file dari sistem
	fmt.Print(fileName)
	os.Remove(filepath.Join(h.uploadDir, fileName))

	return h.service.UpdateMember(member)
}
