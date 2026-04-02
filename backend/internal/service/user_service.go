package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
	"dashboardadminimb/utils"
)

type UserService interface {
	CreateUser(user *entity.User) error
	RegisterUserPending(user *entity.User) error
	UpdatePassword(userID uint, newPassword string) error
	GetAllUsers() ([]entity.User, error)
	GetAllUsersWithPagination(params response.QueryParams) ([]entity.User, int, error)
	GetUserByID(id uint) (*entity.User, error)
	UpdateUser(user *entity.User) error
	DeleteUser(id uint) error
	GetUserByEmail(email string) (*entity.User, error)
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo}
}

func (s *userService) CreateUser(user *entity.User) error {
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = hashedPassword
	if user.Status == "" {
		user.Status = "active"
	}
	return s.repo.Create(user)
}

func (s *userService) RegisterUserPending(user *entity.User) error {
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = hashedPassword
	user.Role = "user"
	user.Status = "pending"
	return s.repo.Create(user)
}

func (s *userService) UpdatePassword(userID uint, newPassword string) error {
	u, err := s.repo.FindByID(userID)
	if err != nil {
		return err
	}
	hashedPassword, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}
	u.Password = hashedPassword
	return s.repo.Update(u)
}

func (s *userService) GetAllUsers() ([]entity.User, error) {
	return s.repo.FindAll()
}

func (s *userService) GetUserByID(id uint) (*entity.User, error) {
	return s.repo.FindByID(id)
}

func (s *userService) UpdateUser(user *entity.User) error {
	return s.repo.Update(user)
}

func (s *userService) DeleteUser(id uint) error {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(user)
}

func (s *userService) GetUserByEmail(email string) (*entity.User, error) {
	user, err := s.repo.FindByEmail(email)
	return user, err
}

func (s *userService) GetAllUsersWithPagination(params response.QueryParams) ([]entity.User, int, error) {
	return s.repo.FindAllWithPagination(params)
}
