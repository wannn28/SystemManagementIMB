package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
	"time"
)

type ActivityService interface {
	LogActivity(userID uint, activityType entity.ActivityType, title, description string) error
	GetRecentActivities(userID uint, limit int) ([]entity.Activity, error)
	GetAllActivitiesWithPagination(params response.QueryParams, userID uint) ([]entity.Activity, int, error)
}

type activityService struct {
	repo repository.ActivityRepository
}

func NewActivityService(repo repository.ActivityRepository) ActivityService {
	return &activityService{repo}
}

func (s *activityService) LogActivity(userID uint, activityType entity.ActivityType, title, description string) error {
	activity := &entity.Activity{
		UserID:      userID,
		Type:        activityType,
		Title:       title,
		Description: description,
		Timestamp:   time.Now(),
	}
	return s.repo.Create(activity)
}

func (s *activityService) GetRecentActivities(userID uint, limit int) ([]entity.Activity, error) {
	return s.repo.GetRecent(userID, limit)
}

func (s *activityService) GetAllActivitiesWithPagination(params response.QueryParams, userID uint) ([]entity.Activity, int, error) {
	return s.repo.FindAllWithPagination(params, userID)
}
