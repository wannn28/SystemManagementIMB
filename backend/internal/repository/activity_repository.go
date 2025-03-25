// internal/repository/activity_repository.go
package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type ActivityRepository interface {
	Create(activity *entity.Activity) error
	GetRecent(limit int) ([]entity.Activity, error)
}

type activityRepository struct {
	db *gorm.DB
}

func NewActivityRepository(db *gorm.DB) ActivityRepository {
	return &activityRepository{db}
}

func (r *activityRepository) Create(activity *entity.Activity) error {
	return r.db.Create(activity).Error
}

func (r *activityRepository) GetRecent(limit int) ([]entity.Activity, error) {
	var activities []entity.Activity
	err := r.db.Order("timestamp DESC").Limit(limit).Find(&activities).Error
	return activities, err
}
