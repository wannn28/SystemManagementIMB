package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"

	"gorm.io/gorm"
)

type ActivityRepository interface {
	Create(activity *entity.Activity) error
	GetRecent(userID uint, limit int) ([]entity.Activity, error)
	FindAllWithPagination(params response.QueryParams, userID uint) ([]entity.Activity, int, error)
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

func (r *activityRepository) GetRecent(userID uint, limit int) ([]entity.Activity, error) {
	var activities []entity.Activity
	err := r.db.Where("user_id = ?", userID).Order("timestamp DESC").Limit(limit).Find(&activities).Error
	return activities, err
}

func (r *activityRepository) FindAllWithPagination(params response.QueryParams, userID uint) ([]entity.Activity, int, error) {
	var activities []entity.Activity

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildActivityQuery(params, userID)

	total, err := queryBuilder.Paginate(query, params, &activities)
	if err != nil {
		return nil, 0, err
	}

	return activities, total, nil
}
