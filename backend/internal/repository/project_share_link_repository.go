package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type ProjectShareLinkRepository interface {
	Create(link *entity.ProjectShareLink) error
	FindByToken(token string) (*entity.ProjectShareLink, error)
	Update(link *entity.ProjectShareLink) error
}

type projectShareLinkRepository struct {
	db *gorm.DB
}

func NewProjectShareLinkRepository(db *gorm.DB) ProjectShareLinkRepository {
	return &projectShareLinkRepository{db: db}
}

func (r *projectShareLinkRepository) Create(link *entity.ProjectShareLink) error {
	return r.db.Create(link).Error
}

func (r *projectShareLinkRepository) FindByToken(token string) (*entity.ProjectShareLink, error) {
	var link entity.ProjectShareLink
	if err := r.db.Where("token = ?", token).First(&link).Error; err != nil {
		return nil, err
	}
	return &link, nil
}

func (r *projectShareLinkRepository) Update(link *entity.ProjectShareLink) error {
	return r.db.Save(link).Error
}

