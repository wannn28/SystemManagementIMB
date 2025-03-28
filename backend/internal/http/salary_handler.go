// Di internal/http/salary_handler.go
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
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type SalaryHandler struct {
	service         service.SalaryService
	memberService   service.MemberService
	uploadDir       string
	detailService   service.SalaryDetailService
	activityService service.ActivityService
}

func NewSalaryHandler(service service.SalaryService, memberService service.MemberService, uploadDir string, detailService service.SalaryDetailService, activityService service.ActivityService) *SalaryHandler {
	return &SalaryHandler{
		service:         service,
		memberService:   memberService,
		uploadDir:       uploadDir,
		detailService:   detailService,
		activityService: activityService,
	}
}

func (h *SalaryHandler) CreateSalary(c echo.Context) error {
	memberID := c.Param("id")

	var salary entity.Salary
	if err := c.Bind(&salary); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	member, err := h.memberService.GetMemberByID(memberID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	salary.MemberID = memberID
	if err := h.service.CreateSalary(&salary); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	err = h.activityService.LogActivity(
		entity.ActivityIncome,
		"Update Gaji",
		fmt.Sprintf("Update gaji untuk %s", member.FullName),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, http.StatusCreated, salary)
}

func (h *SalaryHandler) GetSalaries(c echo.Context) error {
	memberID := c.Param("id")
	salaries, err := h.service.GetSalariesByMember(memberID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, salaries)
}

// Di internal/http/salary_handler.go
func (h *SalaryHandler) UpdateSalary(c echo.Context) error {
	salaryID, err := strconv.Atoi(c.Param("salaryId"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("invalid salary ID"))
	}

	existingSalary, err := h.service.GetSalaryByID(uint(salaryID))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	originalMemberID := existingSalary.MemberID

	if err := c.Bind(existingSalary); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	existingSalary.MemberID = originalMemberID
	existingSalary.ID = uint(salaryID)

	if err := h.service.UpdateSalary(existingSalary); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	member, err := h.memberService.GetMemberByID(originalMemberID)
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	err = h.activityService.LogActivity(
		entity.ActivityUpdate,
		"Update Gaji",
		fmt.Sprintf("Update gaji untuk %s", member.FullName),
	)
	if err != nil {
		fmt.Println("Gagal log activity:", err)
	}

	return response.Success(c, http.StatusOK, existingSalary)
}

func (h *SalaryHandler) DeleteSalary(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("salaryId"))
	existingSalary, err := h.service.GetSalaryByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.DeleteSalary(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	err = h.activityService.LogActivity(
		entity.ActivityExpense,
		"Hapus Gaji",
		fmt.Sprintf("Hapus gaji untuk %s", existingSalary.Member.FullName),
	)
	if err != nil {
		// Handle error logging, maybe just log to console
		fmt.Println("Gagal log activity:", err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *SalaryHandler) UploadDocuments(c echo.Context) error {
	salaryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	salary, err := h.service.GetSalaryByID(uint(salaryID))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

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

	var documents []string
	json.Unmarshal(salary.Documents, &documents)
	documents = append(documents, fileNames...)
	documentsJSON, _ := json.Marshal(documents)
	salary.Documents = documentsJSON

	if err := h.service.UpdateSalary(salary); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, salary)
}

func (h *SalaryHandler) DeleteDocument(c echo.Context) error {
	salaryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	fileName := c.Param("fileName")

	salary, err := h.service.GetSalaryByID(uint(salaryID))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	var documents []string
	json.Unmarshal(salary.Documents, &documents)

	newDocs := make([]string, 0)
	for _, doc := range documents {
		if doc != fileName {
			newDocs = append(newDocs, doc)
		}
	}

	documentsJSON, _ := json.Marshal(newDocs)
	salary.Documents = documentsJSON

	filePath := filepath.Join(h.uploadDir, fileName)
	if err := os.Remove(filePath); err != nil {
		fmt.Println("Gagal menghapus file:", err)
	}

	if err := h.service.UpdateSalary(salary); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	member, err := h.memberService.GetMemberByID(salary.MemberID)
	if err != nil {
		fmt.Printf("Gagal mendapatkan member: %v\n", err)
	} else {
		err = h.activityService.LogActivity(
			entity.ActivityUpdate,
			"Hapus Dokumen Gaji",
			fmt.Sprintf("Hapus dokumen %s dari gaji %s - %s", fileName, member.FullName, salary.Month),
		)
		if err != nil {
			fmt.Printf("Gagal log activity: %v\n", err)
		}
	}

	return response.Success(c, http.StatusOK, salary)
}

func (h *SalaryHandler) saveUploadedFile(file *multipart.FileHeader, dstPath string) error {
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

func (h *SalaryHandler) CreateSalaryDetail(c echo.Context) error {
	// fmt.Println("Request Body:", c.Request().Body)

	salaryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	var detail entity.SalaryDetail
	if err := c.Bind(&detail); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	// fmt.Printf("Received Data: %+v\n", detail)
	detail.SalaryID = uint(salaryID)
	if err := h.detailService.CreateDetail(&detail); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	if err := h.service.RecalculateSalary(detail.SalaryID); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	salary, err := h.service.GetSalaryByID(detail.SalaryID)
	if err == nil {
		member, err := h.memberService.GetMemberByID(salary.MemberID)
		if err == nil {
			h.activityService.LogActivity(
				entity.ActivityIncome,
				"Tambah Detail Gaji",
				fmt.Sprintf("Tambah detail gaji untuk %s - %s: %s", member.FullName, salary.Month, detail.Keterangan),
			)
		}
	}
	return response.Success(c, http.StatusCreated, detail)
}

func (h *SalaryHandler) GetSalaryDetail(c echo.Context) error {
	salaryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	details, err := h.detailService.GetDetailsBySalary(uint(salaryID))
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	return response.Success(c, http.StatusOK, details)

}

func (h *SalaryHandler) UpdateSalaryDetail(c echo.Context) error {
	salaryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	var detail entity.SalaryDetail
	if err := c.Bind(&detail); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}

	detail.SalaryID = uint(salaryID)
	if err := h.detailService.UpdateDetail(&detail); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	if err := h.service.RecalculateSalary(detail.SalaryID); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	salary, err := h.service.GetSalaryByID(detail.SalaryID)
	if err == nil {
		member, err := h.memberService.GetMemberByID(salary.MemberID)
		if err == nil {
			h.activityService.LogActivity(
				entity.ActivityUpdate,
				"Ubah Detail Gaji",
				fmt.Sprintf("Ubah detail gaji untuk %s - %s: %s", member.FullName, salary.Month, detail.Keterangan),
			)
		}
	}
	return response.Success(c, http.StatusOK, detail)
}

func (h *SalaryHandler) DeleteSalaryDetail(c echo.Context) error {
	detailID, err := strconv.Atoi(c.Param("detailId")) // Ambil detailId dari URL
	if err != nil {
		return response.Error(c, http.StatusBadRequest, errors.New("invalid detail ID"))
	}

	// Dapatkan detail untuk mendapatkan SalaryID
	detail, err := h.detailService.GetDetailByID(uint(detailID))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}

	// Hapus detail
	if err := h.detailService.DeleteDetail(uint(detailID)); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	if err := h.service.RecalculateSalary(detail.SalaryID); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}

	salary, err := h.service.GetSalaryByID(detail.SalaryID)
	if err == nil {
		member, err := h.memberService.GetMemberByID(salary.MemberID)
		if err == nil {
			h.activityService.LogActivity(
				entity.ActivityExpense,
				"Hapus Detail Gaji",
				fmt.Sprintf("Hapus detail gaji untuk %s - %s: %s", member.FullName, salary.Month, detail.Keterangan),
			)
		}
	}
	return response.Success(c, http.StatusNoContent, nil)
}
