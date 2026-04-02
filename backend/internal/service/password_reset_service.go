package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type PasswordResetService interface {
	RequestReset(email string) (string, error)
	ResetPassword(resetToken string, newPassword string) error
}

type passwordResetService struct {
	userRepo  repository.UserRepository
	tokenRepo repository.PasswordResetTokenRepository
	userSvc   UserService
}

func NewPasswordResetService(userRepo repository.UserRepository, tokenRepo repository.PasswordResetTokenRepository, userSvc UserService) PasswordResetService {
	return &passwordResetService{userRepo: userRepo, tokenRepo: tokenRepo, userSvc: userSvc}
}

func resetTokenHash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func generateResetToken() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "rst_" + hex.EncodeToString(b), nil
}

func (s *passwordResetService) RequestReset(email string) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return "", errors.New("email is required")
	}
	// Do not leak user existence; but for now we return token only if user exists.
	u, err := s.userRepo.FindByEmail(email)
	if err != nil || u == nil || u.ID == 0 {
		return "", nil
	}
	raw, err := generateResetToken()
	if err != nil {
		return "", err
	}
	row := &entity.PasswordResetToken{
		UserID:    u.ID,
		TokenHash: resetTokenHash(raw),
		ExpiresAt: time.Now().Add(30 * time.Minute),
	}
	if err := s.tokenRepo.Create(row); err != nil {
		return "", err
	}
	return raw, nil
}

func (s *passwordResetService) ResetPassword(resetToken string, newPassword string) error {
	resetToken = strings.TrimSpace(resetToken)
	if resetToken == "" {
		return errors.New("reset_token is required")
	}
	if strings.TrimSpace(newPassword) == "" {
		return errors.New("new_password is required")
	}
	row, err := s.tokenRepo.FindByHash(resetTokenHash(resetToken))
	if err != nil || row == nil || row.ID == 0 {
		return errors.New("invalid reset_token")
	}
	if row.UsedAt != nil {
		return errors.New("reset_token already used")
	}
	if time.Now().After(row.ExpiresAt) {
		return errors.New("reset_token expired")
	}
	if err := s.userSvc.UpdatePassword(row.UserID, newPassword); err != nil {
		return err
	}
	now := time.Now()
	row.UsedAt = &now
	return s.tokenRepo.Update(row)
}

