package builder

import "dashboardadminimb/internal/entity"

type UserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type UserResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func BuildUserEntity(req UserRequest) entity.User {
	return entity.User{
		Name:  req.Name,
		Email: req.Email,
	}
}

func BuildUserResponse(user entity.User) UserResponse {
	return UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}
}
