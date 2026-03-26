package entity

import "time"

type IntegrationAPIToken struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	Name        string    `gorm:"size:120;not null" json:"name"`
	TokenHash   string    `gorm:"size:64;not null;uniqueIndex" json:"-"`
	TokenPrefix string    `gorm:"size:16;not null" json:"token_prefix"`
	Scopes      string    `gorm:"type:json;not null" json:"scopes"`
	IsActive    bool      `gorm:"not null;default:true" json:"is_active"`
	LastUsedAt  *time.Time `json:"last_used_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (IntegrationAPIToken) TableName() string {
	return "integration_api_tokens"
}

