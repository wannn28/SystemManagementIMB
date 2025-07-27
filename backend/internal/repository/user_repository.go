package repository

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/pkg/database"
	"dashboardadminimb/pkg/response"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *entity.User) error
	FindAll() ([]entity.User, error)
	FindAllWithPagination(params response.QueryParams) ([]entity.User, int, error)
	FindByID(id uint) (*entity.User, error)
	FindByEmail(email string) (*entity.User, error) // Tambahkan method baru
	Update(user *entity.User) error
	Delete(user *entity.User) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db}
}

func (r *userRepository) Create(user *entity.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindAll() ([]entity.User, error) {
	var users []entity.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *userRepository) FindByID(id uint) (*entity.User, error) {
	var user entity.User
	err := r.db.First(&user, id).Error
	return &user, err
}

func (r *userRepository) Update(user *entity.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) Delete(user *entity.User) error {
	return r.db.Delete(user).Error
}
func (r *userRepository) FindByEmail(email string) (*entity.User, error) {
	var user entity.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *userRepository) FindAllWithPagination(params response.QueryParams) ([]entity.User, int, error) {
	var users []entity.User

	queryBuilder := database.NewQueryBuilder(r.db)
	query := queryBuilder.BuildUserQuery(params)

	total, err := queryBuilder.Paginate(query, params, &users)
	if err != nil {
		return nil, 0, err
	}

	return users, total, nil
}
