package service

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"strings"

	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
)

type IntegrationAPITokenService interface {
	CreateToken(userID uint, name string, scopes map[string]bool) (*entity.IntegrationAPIToken, string, error)
	ListTokens(userID uint) ([]entity.IntegrationAPIToken, error)
	UpdateToken(userID uint, id uint, name string, scopes map[string]bool, isActive bool) (*entity.IntegrationAPIToken, error)
	DeleteToken(userID uint, id uint) error
	ValidateToken(rawToken string, requiredScope string) (*entity.IntegrationAPIToken, map[string]bool, error)
}

type integrationAPITokenService struct {
	repo repository.IntegrationAPITokenRepository
}

func NewIntegrationAPITokenService(repo repository.IntegrationAPITokenRepository) IntegrationAPITokenService {
	return &integrationAPITokenService{repo: repo}
}

func generateRawToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "intg_" + hex.EncodeToString(b), nil
}

func hashToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func normalizeScopes(scopes map[string]bool) map[string]bool {
	allowed := []string{"projects", "finance", "reports", "team", "inventory"}
	out := map[string]bool{}
	for _, key := range allowed {
		out[key] = scopes[key]
	}
	return out
}

func parseScopes(raw string) map[string]bool {
	out := map[string]bool{}
	_ = json.Unmarshal([]byte(raw), &out)
	return out
}

func (s *integrationAPITokenService) CreateToken(userID uint, name string, scopes map[string]bool) (*entity.IntegrationAPIToken, string, error) {
	if userID == 0 {
		return nil, "", errors.New("invalid user id")
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, "", errors.New("name is required")
	}
	raw, err := generateRawToken()
	if err != nil {
		return nil, "", err
	}
	finalScopes := normalizeScopes(scopes)
	scopeBytes, _ := json.Marshal(finalScopes)
	row := &entity.IntegrationAPIToken{
		UserID:      userID,
		Name:        name,
		TokenHash:   hashToken(raw),
		TokenPrefix: raw[:12],
		Scopes:      string(scopeBytes),
		IsActive:    true,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, "", err
	}
	return row, raw, nil
}

func (s *integrationAPITokenService) ListTokens(userID uint) ([]entity.IntegrationAPIToken, error) {
	return s.repo.FindByUserID(userID)
}

func (s *integrationAPITokenService) UpdateToken(userID uint, id uint, name string, scopes map[string]bool, isActive bool) (*entity.IntegrationAPIToken, error) {
	row, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}
	name = strings.TrimSpace(name)
	if name != "" {
		row.Name = name
	}
	scopeBytes, _ := json.Marshal(normalizeScopes(scopes))
	row.Scopes = string(scopeBytes)
	row.IsActive = isActive
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *integrationAPITokenService) DeleteToken(userID uint, id uint) error {
	return s.repo.DeleteByIDAndUserID(id, userID)
}

func (s *integrationAPITokenService) ValidateToken(rawToken string, requiredScope string) (*entity.IntegrationAPIToken, map[string]bool, error) {
	rawToken = strings.TrimSpace(rawToken)
	if rawToken == "" {
		return nil, nil, errors.New("missing integration token")
	}
	row, err := s.repo.FindByHash(hashToken(rawToken))
	if err != nil {
		return nil, nil, errors.New("invalid integration token")
	}
	if !row.IsActive {
		return nil, nil, errors.New("integration token inactive")
	}
	scopes := parseScopes(row.Scopes)
	if requiredScope != "" && !scopes[requiredScope] {
		return nil, nil, errors.New("scope not allowed")
	}
	_ = s.repo.UpdateLastUsed(row.ID)
	return row, scopes, nil
}

