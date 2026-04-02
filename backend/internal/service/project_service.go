package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
)

type ProjectService interface {
	CreateProject(userID uint, project *entity.Project) error
	GetAllProjects(userID uint) ([]entity.Project, error)
	GetAllProjectsWithPagination(params response.QueryParams, userID uint) ([]entity.Project, int, error)
	GetProjectByID(id uint, userID uint) (*entity.Project, error)
	GetProjectByIDAdmin(id uint) (*entity.Project, error)
	UpdateProject(project *entity.Project) error
	DeleteProject(id uint, userID uint) error
	GetProjectCount(userID uint) (int64, error)
}

type projectService struct {
	repo repository.ProjectRepository
}

func NewProjectService(repo repository.ProjectRepository) ProjectService {
	return &projectService{repo}
}

func (s *projectService) GetProjectCount(userID uint) (int64, error) {
	return s.repo.Count(userID)
}

func (s *projectService) CreateProject(userID uint, project *entity.Project) error {
	project.UserID = userID
	return s.repo.Create(project)
}

func (s *projectService) GetAllProjects(userID uint) ([]entity.Project, error) {
	return s.repo.FindAll(userID)
}

func (s *projectService) GetProjectByID(id uint, userID uint) (*entity.Project, error) {
	return s.repo.FindByID(id, userID)
}

func (s *projectService) GetProjectByIDAdmin(id uint) (*entity.Project, error) {
	return s.repo.FindByIDAdmin(id)
}

func (s *projectService) UpdateProject(project *entity.Project) error {
	return s.repo.Update(project)
}

func (s *projectService) DeleteProject(id uint, userID uint) error {
	project, err := s.repo.FindByID(id, userID)
	if err != nil {
		return err
	}
	return s.repo.Delete(project)
}

func (s *projectService) GetAllProjectsWithPagination(params response.QueryParams, userID uint) ([]entity.Project, int, error) {
	return s.repo.FindAllWithPagination(params, userID)
}
