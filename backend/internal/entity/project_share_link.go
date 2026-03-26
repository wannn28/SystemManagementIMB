package entity

import "time"

type ProjectShareLink struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	ProjectID uint      `gorm:"index;not null" json:"project_id"`
	Token     string    `gorm:"type:varchar(128);uniqueIndex;not null" json:"token"`
	EditToken string    `gorm:"type:varchar(128);uniqueIndex;not null" json:"edit_token"`
	Settings  string    `gorm:"type:json;not null" json:"settings"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (ProjectShareLink) TableName() string {
	return "project_share_links"
}

