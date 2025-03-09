package repository

import (
	"dashboardadminimb/internal/entity"

	"gorm.io/gorm"
)

type MemberRepository interface {
	Create(member *entity.Member) error
	FindAll() ([]entity.Member, error)
	FindByID(id string) (*entity.Member, error)
	Update(member *entity.Member) error
	Delete(member *entity.Member) error
}

type memberRepository struct {
	db *gorm.DB
}

func NewMemberRepository(db *gorm.DB) MemberRepository {
	return &memberRepository{db}
}

func (r *memberRepository) Create(member *entity.Member) error {
	return r.db.Model(&entity.Member{}).Create(member).Error
}

func (r *memberRepository) FindAll() ([]entity.Member, error) {
	var members []entity.Member
	err := r.db.Model(&entity.Member{}).Find(&members).Error
	return members, err
}

// Di internal/repository/member_repository.go
func (r *memberRepository) FindByID(id string) (*entity.Member, error) {
	var member entity.Member
	// Tambahkan Preload("Salaries")
	err := r.db.Preload("Salaries").Where("id = ?", id).First(&member).Error
	return &member, err
}
func (r *memberRepository) Update(member *entity.Member) error {
	return r.db.Save(member).Error
}

func (r *memberRepository) Delete(member *entity.Member) error {
	return r.db.Delete(member).Error
}
