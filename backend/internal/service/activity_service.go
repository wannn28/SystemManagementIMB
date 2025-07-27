// internal/service/activity_service.go
package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
	"time"
)

type ActivityService interface {
	LogActivity(activityType entity.ActivityType, title, description string) error
	GetRecentActivities(limit int) ([]entity.Activity, error)
	GetAllActivitiesWithPagination(params response.QueryParams) ([]entity.Activity, int, error)
}

type activityService struct {
	repo repository.ActivityRepository
}

func NewActivityService(repo repository.ActivityRepository) ActivityService {
	return &activityService{repo}
}

func (s *activityService) LogActivity(activityType entity.ActivityType, title, description string) error {
	activity := &entity.Activity{
		Type:        activityType,
		Title:       title,
		Description: description,
		Timestamp:   time.Now(),
	}
	return s.repo.Create(activity)
}

func (s *activityService) GetRecentActivities(limit int) ([]entity.Activity, error) {
	return s.repo.GetRecent(limit)
}

func (s *activityService) GetAllActivitiesWithPagination(params response.QueryParams) ([]entity.Activity, int, error) {
	return s.repo.FindAllWithPagination(params)
}
