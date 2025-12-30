
package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
)

type ProjectService interface {
	CreateProject(project *entity.Project) error
	GetAllProjects() ([]entity.Project, error)
	GetAllProjectsWithPagination(params response.QueryParams) ([]entity.Project, int, error)
	GetProjectByID(id uint) (*entity.Project, error)
	UpdateProject(project *entity.Project) error
	DeleteProject(id uint) error
	GetProjectCount() (int64, error)
}

type projectService struct {
	repo repository.ProjectRepository
}

func (s *projectService) GetProjectCount() (int64, error) {
	return s.repo.Count()
}

func NewProjectService(repo repository.ProjectRepository) ProjectService {
	return &projectService{repo}
}

func (s *projectService) CreateProject(project *entity.Project) error {
	return s.repo.Create(project)
}

func (s *projectService) GetAllProjects() ([]entity.Project, error) {
	return s.repo.FindAll()
}

func (s *projectService) GetProjectByID(id uint) (*entity.Project, error) {
	return s.repo.FindByID(id)
}

func (s *projectService) UpdateProject(project *entity.Project) error {
	return s.repo.Update(project)
}

func (s *projectService) DeleteProject(id uint) error {
	project, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(project)
}

func (s *projectService) GetAllProjectsWithPagination(params response.QueryParams) ([]entity.Project, int, error) {
	return s.repo.FindAllWithPagination(params)
}
