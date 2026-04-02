package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"

	"gorm.io/gorm"
)

type ProjectRepository interface {
	Create(project *entity.Project) error
	FindAll(userID uint) ([]entity.Project, error)
	FindAllWithPagination(params response.QueryParams, userID uint) ([]entity.Project, int, error)
	FindByID(id uint, userID uint) (*entity.Project, error)
	FindByIDAdmin(id uint) (*entity.Project, error)
	Update(project *entity.Project) error
	Delete(project *entity.Project) error
	Count(userID uint) (int64, error)
}

type projectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) ProjectRepository {
	return &projectRepository{db}
}

func (r *projectRepository) Count(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.Project{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *projectRepository) Create(project *entity.Project) error {
	return r.db.Create(project).Error
}

func (r *projectRepository) FindAll(userID uint) ([]entity.Project, error) {
	var projects []entity.Project
	err := r.db.Where("user_id = ?", userID).Find(&projects).Error
	return projects, err
}

func (r *projectRepository) FindByID(id uint, userID uint) (*entity.Project, error) {
	var project entity.Project
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&project).Error
	return &project, err
}

func (r *projectRepository) FindByIDAdmin(id uint) (*entity.Project, error) {
	var project entity.Project
	err := r.db.Where("id = ?", id).First(&project).Error
	return &project, err
}

func (r *projectRepository) Update(project *entity.Project) error {
	return r.db.Save(project).Error
}

func (r *projectRepository) Delete(project *entity.Project) error {
	return r.db.Delete(project).Error
}

func (r *projectRepository) FindAllWithPagination(params response.QueryParams, userID uint) ([]entity.Project, int, error) {
	var projects []entity.Project

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildProjectQuery(params, userID)

	total, err := queryBuilder.Paginate(query, params, &projects)
	if err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}
