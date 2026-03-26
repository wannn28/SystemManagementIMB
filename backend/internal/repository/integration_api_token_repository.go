package repository

import (
	"dashboardadminimb/internal/entity"
	"time"

	"gorm.io/gorm"
)

type IntegrationAPITokenRepository interface {
	Create(token *entity.IntegrationAPIToken) error
	FindByUserID(userID uint) ([]entity.IntegrationAPIToken, error)
	FindByIDAndUserID(id uint, userID uint) (*entity.IntegrationAPIToken, error)
	FindByHash(tokenHash string) (*entity.IntegrationAPIToken, error)
	Update(token *entity.IntegrationAPIToken) error
	DeleteByIDAndUserID(id uint, userID uint) error
	UpdateLastUsed(id uint) error
}

type integrationAPITokenRepository struct {
	db *gorm.DB
}

func NewIntegrationAPITokenRepository(db *gorm.DB) IntegrationAPITokenRepository {
	return &integrationAPITokenRepository{db: db}
}

func (r *integrationAPITokenRepository) Create(token *entity.IntegrationAPIToken) error {
	return r.db.Create(token).Error
}

func (r *integrationAPITokenRepository) FindByUserID(userID uint) ([]entity.IntegrationAPIToken, error) {
	var rows []entity.IntegrationAPIToken
	err := r.db.Where("user_id = ?", userID).Order("id DESC").Find(&rows).Error
	return rows, err
}

func (r *integrationAPITokenRepository) FindByIDAndUserID(id uint, userID uint) (*entity.IntegrationAPIToken, error) {
	var row entity.IntegrationAPIToken
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&row).Error
	return &row, err
}

func (r *integrationAPITokenRepository) FindByHash(tokenHash string) (*entity.IntegrationAPIToken, error) {
	var row entity.IntegrationAPIToken
	err := r.db.Where("token_hash = ?", tokenHash).First(&row).Error
	return &row, err
}

func (r *integrationAPITokenRepository) Update(token *entity.IntegrationAPIToken) error {
	return r.db.Save(token).Error
}

func (r *integrationAPITokenRepository) DeleteByIDAndUserID(id uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&entity.IntegrationAPIToken{}).Error
}

func (r *integrationAPITokenRepository) UpdateLastUsed(id uint) error {
	return r.db.Model(&entity.IntegrationAPIToken{}).Where("id = ?", id).Update("last_used_at", time.Now()).Error
}

