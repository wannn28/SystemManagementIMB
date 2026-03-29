package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type ProjectShareLinkRepository interface {
	Create(link *entity.ProjectShareLink) error
	FindByID(id uint) (*entity.ProjectShareLink, error)
	FindByToken(token string) (*entity.ProjectShareLink, error)
	FindByProjectID(projectID uint) ([]entity.ProjectShareLink, error)
	Update(link *entity.ProjectShareLink) error
	Delete(id uint) error
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

func (r *projectShareLinkRepository) FindByID(id uint) (*entity.ProjectShareLink, error) {
	var link entity.ProjectShareLink
	if err := r.db.First(&link, id).Error; err != nil {
		return nil, err
	}
	return &link, nil
}

func (r *projectShareLinkRepository) FindByToken(token string) (*entity.ProjectShareLink, error) {
	var link entity.ProjectShareLink
	if err := r.db.Where("token = ?", token).First(&link).Error; err != nil {
		return nil, err
	}
	return &link, nil
}

func (r *projectShareLinkRepository) FindByProjectID(projectID uint) ([]entity.ProjectShareLink, error) {
	var links []entity.ProjectShareLink
	if err := r.db.Where("project_id = ?", projectID).Order("updated_at DESC").Find(&links).Error; err != nil {
		return nil, err
	}
	return links, nil
}

func (r *projectShareLinkRepository) Update(link *entity.ProjectShareLink) error {
	return r.db.Save(link).Error
}

func (r *projectShareLinkRepository) Delete(id uint) error {
	return r.db.Delete(&entity.ProjectShareLink{}, id).Error
}

