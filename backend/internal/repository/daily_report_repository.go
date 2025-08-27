package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type DailyReportRepository interface {
	Create(report *entity.ReportDaily) error
	FindByProjectID(projectID uint) ([]entity.ReportDaily, error)
	FindByID(id uint) (*entity.ReportDaily, error)
	Update(report *entity.ReportDaily) error
	Delete(report *entity.ReportDaily) error
	FindByDateRange(projectID uint, startDate, endDate string) ([]entity.ReportDaily, error)
}

type dailyReportRepository struct {
	db *gorm.DB
}

func NewDailyReportRepository(db *gorm.DB) DailyReportRepository {
	return &dailyReportRepository{db}
}

func (r *dailyReportRepository) Create(report *entity.ReportDaily) error {
	return r.db.Create(report).Error
}

func (r *dailyReportRepository) FindByProjectID(projectID uint) ([]entity.ReportDaily, error) {
	var reports []entity.ReportDaily
	err := r.db.Where("project_id = ?", projectID).Preload("Images").Find(&reports).Error
	return reports, err
}

func (r *dailyReportRepository) FindByID(id uint) (*entity.ReportDaily, error) {
	var report entity.ReportDaily
	err := r.db.Preload("Images").First(&report, id).Error
	return &report, err
}

func (r *dailyReportRepository) Update(report *entity.ReportDaily) error {
	return r.db.Save(report).Error
}

func (r *dailyReportRepository) Delete(report *entity.ReportDaily) error {
	return r.db.Delete(report).Error
}

func (r *dailyReportRepository) FindByDateRange(projectID uint, startDate, endDate string) ([]entity.ReportDaily, error) {
	var reports []entity.ReportDaily
	err := r.db.Where("project_id = ? AND date BETWEEN ? AND ?", projectID, startDate, endDate).
		Preload("Images").Find(&reports).Error
	return reports, err
}
