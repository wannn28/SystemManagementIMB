package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"

	"gorm.io/gorm"
)

type MemberRepository interface {
	Create(member *entity.Member) error
	FindAll() ([]entity.Member, error)
	FindAllWithPagination(params response.QueryParams) ([]entity.Member, int, error)
	FindByID(id string) (*entity.Member, error)
	Update(member *entity.Member) error
	Delete(member *entity.Member) error
	Count() (int64, error)
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

func (r *memberRepository) Count() (int64, error) {
	var count int64
	err := r.db.Model(&entity.Member{}).Count(&count).Error
	return count, err
}

func (r *memberRepository) FindAllWithPagination(params response.QueryParams) ([]entity.Member, int, error) {
	var members []entity.Member

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildMemberQuery(params)

	total, err := queryBuilder.Paginate(query, params, &members)
	if err != nil {
		return nil, 0, err
	}

	return members, total, nil
}
