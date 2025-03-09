package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type UserService interface {
	CreateUser(user *entity.User) error
	GetAllUsers() ([]entity.User, error)
	GetUserByID(id uint) (*entity.User, error)
	UpdateUser(user *entity.User) error
	DeleteUser(id uint) error
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo}
}

func (s *userService) CreateUser(user *entity.User) error {
	return s.repo.Create(user)
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