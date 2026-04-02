package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type PasswordResetTokenRepository interface {
	Create(row *entity.PasswordResetToken) error
	FindByHash(hash string) (*entity.PasswordResetToken, error)
	Update(row *entity.PasswordResetToken) error
}

type passwordResetTokenRepository struct {
	db *gorm.DB
}

func NewPasswordResetTokenRepository(db *gorm.DB) PasswordResetTokenRepository {
	return &passwordResetTokenRepository{db: db}
}

func (r *passwordResetTokenRepository) Create(row *entity.PasswordResetToken) error {
	return r.db.Create(row).Error
}

func (r *passwordResetTokenRepository) FindByHash(hash string) (*entity.PasswordResetToken, error) {
	var row entity.PasswordResetToken
	err := r.db.Where("token_hash = ?", hash).First(&row).Error
	return &row, err
}

func (r *passwordResetTokenRepository) Update(row *entity.PasswordResetToken) error {
	return r.db.Save(row).Error
}

