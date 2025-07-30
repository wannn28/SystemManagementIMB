// internal/service/api_key_service.go
package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type ApiKeyService struct {
	apiKeyRepo *repository.ApiKeyRepository
}

func NewApiKeyService(apiKeyRepo *repository.ApiKeyRepository) *ApiKeyService {
	return &ApiKeyService{
		apiKeyRepo: apiKeyRepo,
	}
}

// GetApiKey retrieves API key for a specific user
func (s *ApiKeyService) GetApiKey(userID uint) (*entity.ApiKey, error) {
	return s.apiKeyRepo.GetApiKeyByUserID(userID)
}

// UpsertApiKey creates or updates API key for a user
func (s *ApiKeyService) UpsertApiKey(userID uint, apiKey string) error {
	return s.apiKeyRepo.UpsertApiKey(userID, apiKey)
}

// DeleteApiKey deletes API key for a user
func (s *ApiKeyService) DeleteApiKey(userID uint) error {
	return s.apiKeyRepo.DeleteApiKey(userID)
}
