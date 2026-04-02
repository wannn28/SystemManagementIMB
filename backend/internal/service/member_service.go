package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
	"time"
)

type MemberService interface {
	CreateMember(userID uint, member *entity.Member) error
	GetAllMembers(userID uint) ([]entity.Member, error)
	GetAllMembersWithPagination(params response.QueryParams, userID uint) ([]entity.Member, int, error)
	GetMemberByID(id string) (*entity.Member, error)
	UpdateMember(member *entity.Member) error
	DeleteMember(id string) error
	GetMemberCount(userID uint) (int64, error)
	DeactivateMember(id string, reason string) error
	ActivateMember(id string) error
	GetMemberTotalSalary(memberID string) (float64, error)
	GetAllMembersTotalSalary(userID uint) (float64, error)
	GetMemberTotalSalaryWithFilter(memberID string, year string, month string) (float64, error)
	GetAllMembersTotalSalaryWithFilter(userID uint, year string, month string) (float64, error)
	GetAllMembersWithSalaryInfo(userID uint, year string, month string, orderBy string) ([]repository.MemberSalaryInfo, error)
	GetMemberMonthlySalaryDetails(memberID string, year string) ([]repository.MonthlySalaryDetail, error)
}

type memberService struct {
	repo repository.MemberRepository
}

func NewMemberService(repo repository.MemberRepository) MemberService {
	return &memberService{repo}
}

func (s *memberService) GetMemberCount(userID uint) (int64, error) {
	return s.repo.Count(userID)
}

func (s *memberService) CreateMember(userID uint, member *entity.Member) error {
	member.UserID = userID
	return s.repo.Create(member)
}

func (s *memberService) GetAllMembers(userID uint) ([]entity.Member, error) {
	return s.repo.FindAll(userID)
}

func (s *memberService) GetMemberByID(id string) (*entity.Member, error) {
	return s.repo.FindByID(id)
}

func (s *memberService) UpdateMember(member *entity.Member) error {
	return s.repo.Update(member)
}

func (s *memberService) DeleteMember(id string) error {
	member, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	return s.repo.Delete(member)
}

func (s *memberService) GetAllMembersWithPagination(params response.QueryParams, userID uint) ([]entity.Member, int, error) {
	return s.repo.FindAllWithPagination(params, userID)
}

func (s *memberService) DeactivateMember(id string, reason string) error {
	deactivatedAt := time.Now().Format(time.RFC3339)
	return s.repo.DeactivateMember(id, reason, deactivatedAt)
}

func (s *memberService) ActivateMember(id string) error {
	return s.repo.ActivateMember(id)
}

func (s *memberService) GetMemberTotalSalary(memberID string) (float64, error) {
	return s.repo.GetMemberTotalSalary(memberID)
}

func (s *memberService) GetAllMembersTotalSalary(userID uint) (float64, error) {
	return s.repo.GetAllMembersTotalSalary(userID)
}

func (s *memberService) GetMemberTotalSalaryWithFilter(memberID string, year string, month string) (float64, error) {
	return s.repo.GetMemberTotalSalaryWithFilter(memberID, year, month)
}

func (s *memberService) GetAllMembersTotalSalaryWithFilter(userID uint, year string, month string) (float64, error) {
	return s.repo.GetAllMembersTotalSalaryWithFilter(userID, year, month)
}

func (s *memberService) GetAllMembersWithSalaryInfo(userID uint, year string, month string, orderBy string) ([]repository.MemberSalaryInfo, error) {
	return s.repo.GetAllMembersWithSalaryInfo(userID, year, month, orderBy)
}

func (s *memberService) GetMemberMonthlySalaryDetails(memberID string, year string) ([]repository.MonthlySalaryDetail, error) {
	return s.repo.GetMemberMonthlySalaryDetails(memberID, year)
}
