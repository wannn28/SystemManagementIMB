package service

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type ProjectShareLinkService interface {
	Create(projectID uint, settings json.RawMessage) (*entity.ProjectShareLink, error)
	GetByToken(token string) (*entity.ProjectShareLink, error)
	UpdateSettings(token string, editToken string, settings json.RawMessage) (*entity.ProjectShareLink, error)
}

type projectShareLinkService struct {
	repo repository.ProjectShareLinkRepository
}

func NewProjectShareLinkService(repo repository.ProjectShareLinkRepository) ProjectShareLinkService {
	return &projectShareLinkService{repo: repo}
}

func randomToken(bytes int) (string, error) {
	b := make([]byte, bytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *projectShareLinkService) Create(projectID uint, settings json.RawMessage) (*entity.ProjectShareLink, error) {
	if projectID == 0 {
		return nil, errors.New("project_id is required")
	}
	if len(settings) == 0 {
		settings = json.RawMessage(`{}`)
	}
	token, err := randomToken(24)
	if err != nil {
		return nil, err
	}
	editToken, err := randomToken(24)
	if err != nil {
		return nil, err
	}

	link := &entity.ProjectShareLink{
		ProjectID: projectID,
		Token:     token,
		EditToken: editToken,
		Settings:  string(settings),
	}
	if err := s.repo.Create(link); err != nil {
		return nil, err
	}
	return link, nil
}

func (s *projectShareLinkService) GetByToken(token string) (*entity.ProjectShareLink, error) {
	if token == "" {
		return nil, errors.New("token is required")
	}
	return s.repo.FindByToken(token)
}

func (s *projectShareLinkService) UpdateSettings(token string, editToken string, settings json.RawMessage) (*entity.ProjectShareLink, error) {
	if token == "" {
		return nil, errors.New("token is required")
	}
	if editToken == "" {
		return nil, errors.New("edit_token is required")
	}
	link, err := s.repo.FindByToken(token)
	if err != nil {
		return nil, err
	}
	if link.EditToken != editToken {
		return nil, errors.New("invalid edit_token")
	}
	if len(settings) == 0 {
		settings = json.RawMessage(`{}`)
	}
	link.Settings = string(settings)
	if err := s.repo.Update(link); err != nil {
		return nil, err
	}
	return link, nil
}

