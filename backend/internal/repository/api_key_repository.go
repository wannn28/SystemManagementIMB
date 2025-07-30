// internal/repository/api_key_repository.go
package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type ApiKeyRepository struct {
	db *gorm.DB
}

func NewApiKeyRepository(db *gorm.DB) *ApiKeyRepository {
	return &ApiKeyRepository{db: db}
}

// GetApiKeyByUserID retrieves API key for a specific user
func (r *ApiKeyRepository) GetApiKeyByUserID(userID uint) (*entity.ApiKey, error) {
	var apiKey entity.ApiKey
	err := r.db.Where("user_id = ?", userID).First(&apiKey).Error
	if err != nil {
		return nil, err
	}
	return &apiKey, nil
}

// UpsertApiKey creates or updates API key for a user
func (r *ApiKeyRepository) UpsertApiKey(userID uint, apiKey string) error {
	var existingApiKey entity.ApiKey

	// Check if API key exists for this user
	err := r.db.Where("user_id = ?", userID).First(&existingApiKey).Error

	if err == gorm.ErrRecordNotFound {
		// Create new API key
		newApiKey := entity.ApiKey{
			UserID: userID,
			ApiKey: apiKey,
		}
		return r.db.Create(&newApiKey).Error
	} else if err != nil {
		return err
	}

	// Update existing API key
	return r.db.Model(&existingApiKey).Update("api_key", apiKey).Error
}

// DeleteApiKey deletes API key for a user
func (r *ApiKeyRepository) DeleteApiKey(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&entity.ApiKey{}).Error
}
