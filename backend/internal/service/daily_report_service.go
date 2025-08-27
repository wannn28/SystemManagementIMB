package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"time"
)

type DailyReportService interface {
	CreateDailyReport(report *entity.ReportDaily) error
	GetDailyReportsByProject(projectID uint) ([]entity.ReportDaily, error)
	GetDailyReportByID(id uint) (*entity.ReportDaily, error)
	UpdateDailyReport(report *entity.ReportDaily) error
	DeleteDailyReport(id uint) error
	GetDailyReportsByDateRange(projectID uint, startDate, endDate string) ([]entity.ReportDaily, error)
}

type dailyReportService struct {
	dailyReportRepo repository.DailyReportRepository
}

func NewDailyReportService(dailyReportRepo repository.DailyReportRepository) DailyReportService {
	return &dailyReportService{
		dailyReportRepo: dailyReportRepo,
	}
}

func (s *dailyReportService) CreateDailyReport(report *entity.ReportDaily) error {
	now := time.Now().Unix()
	report.CreatedAt = now
	report.UpdatedAt = now

	// Set timestamps for images
	for i := range report.Images {
		report.Images[i].CreatedAt = now
		report.Images[i].UpdatedAt = now
	}

	return s.dailyReportRepo.Create(report)
}

func (s *dailyReportService) GetDailyReportsByProject(projectID uint) ([]entity.ReportDaily, error) {
	return s.dailyReportRepo.FindByProjectID(projectID)
}

func (s *dailyReportService) GetDailyReportByID(id uint) (*entity.ReportDaily, error) {
	return s.dailyReportRepo.FindByID(id)
}

func (s *dailyReportService) UpdateDailyReport(report *entity.ReportDaily) error {
	report.UpdatedAt = time.Now().Unix()

	// Update timestamps for images
	for i := range report.Images {
		report.Images[i].UpdatedAt = time.Now().Unix()
	}

	return s.dailyReportRepo.Update(report)
}

func (s *dailyReportService) DeleteDailyReport(id uint) error {
	report, err := s.dailyReportRepo.FindByID(id)
	if err != nil {
		return err
	}
	return s.dailyReportRepo.Delete(report)
}

func (s *dailyReportService) GetDailyReportsByDateRange(projectID uint, startDate, endDate string) ([]entity.ReportDaily, error) {
	return s.dailyReportRepo.FindByDateRange(projectID, startDate, endDate)
}
