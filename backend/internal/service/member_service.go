package service

import (
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/repository"
	"dashboardadminimb/pkg/response"
)

type MemberService interface {
	CreateMember(member *entity.Member) error
	GetAllMembers() ([]entity.Member, error)
	GetAllMembersWithPagination(params response.QueryParams) ([]entity.Member, int, error)
	GetMemberByID(id string) (*entity.Member, error)
	UpdateMember(member *entity.Member) error
	DeleteMember(id string) error
	GetMemberCount() (int64, error)
}

type memberService struct {
	repo repository.MemberRepository
}

func (s *memberService) GetMemberCount() (int64, error) {
	return s.repo.Count()
}

func NewMemberService(repo repository.MemberRepository) MemberService {
	return &memberService{repo}
}

func (s *memberService) CreateMember(member *entity.Member) error {
	return s.repo.Create(member)
}

func (s *memberService) GetAllMembers() ([]entity.Member, error) {
	return s.repo.FindAll()
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

func (s *memberService) GetAllMembersWithPagination(params response.QueryParams) ([]entity.Member, int, error) {
	return s.repo.FindAllWithPagination(params)
}
