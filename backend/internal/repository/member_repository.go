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
	DeactivateMember(id string, reason string, deactivatedAt string) error
	ActivateMember(id string) error
	GetMemberTotalSalary(memberID string) (float64, error)
	GetAllMembersTotalSalary() (float64, error)
	GetMemberTotalSalaryWithFilter(memberID string, year string, month string) (float64, error)
	GetAllMembersTotalSalaryWithFilter(year string, month string) (float64, error)
	GetAllMembersWithSalaryInfo(year string, month string, orderBy string) ([]MemberSalaryInfo, error)
	GetMemberMonthlySalaryDetails(memberID string, year string) ([]MonthlySalaryDetail, error)
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

func (r *memberRepository) DeactivateMember(id string, reason string, deactivatedAt string) error {
	return r.db.Model(&entity.Member{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_active":           false,
			"deactivation_reason": reason,
			"deactivated_at":      deactivatedAt,
		}).Error
}

func (r *memberRepository) ActivateMember(id string) error {
	return r.db.Model(&entity.Member{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_active":           true,
			"deactivation_reason": "",
			"deactivated_at":      nil,
		}).Error
}

func (r *memberRepository) GetMemberTotalSalary(memberID string) (float64, error) {
	var total float64
	err := r.db.Model(&entity.Salary{}).
		Where("member_id = ? AND status = ?", memberID, "Paid").
		Select("COALESCE(SUM(salary), 0)").
		Scan(&total).Error
	return total, err
}

func (r *memberRepository) GetAllMembersTotalSalary() (float64, error) {
	var total float64
	err := r.db.Model(&entity.Salary{}).
		Where("status = ?", "Paid").
		Select("COALESCE(SUM(salary), 0)").
		Scan(&total).Error
	return total, err
}

func (r *memberRepository) GetMemberTotalSalaryWithFilter(memberID string, year string, month string) (float64, error) {
	var total float64
	query := r.db.Model(&entity.Salary{}).Where("member_id = ? AND status = ?", memberID, "Paid")
	
	// Map month number to Indonesian month name
	monthNames := map[string]string{
		"01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
		"05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
		"09": "September", "10": "Oktober", "11": "November", "12": "Desember",
	}
	
	if year != "" && month != "" {
		monthName := monthNames[month]
		query = query.Where("month = ?", monthName+" "+year)
	} else if year != "" {
		query = query.Where("month LIKE ?", "% "+year)
	}
	
	err := query.Select("COALESCE(SUM(salary), 0)").Scan(&total).Error
	return total, err
}

func (r *memberRepository) GetAllMembersTotalSalaryWithFilter(year string, month string) (float64, error) {
	var total float64
	query := r.db.Model(&entity.Salary{}).Where("status = ?", "Paid")
	
	// Map month number to Indonesian month name
	monthNames := map[string]string{
		"01": "Januari", "02": "Februari", "03": "Maret", "04": "April",
		"05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus",
		"09": "September", "10": "Oktober", "11": "November", "12": "Desember",
	}
	
	if year != "" && month != "" {
		monthName := monthNames[month]
		query = query.Where("month = ?", monthName+" "+year)
	} else if year != "" {
		query = query.Where("month LIKE ?", "% "+year)
	}
	
	err := query.Select("COALESCE(SUM(salary), 0)").Scan(&total).Error
	return total, err
}

type MemberSalaryInfo struct {
	MemberID    string  `json:"member_id"`
	FullName    string  `json:"full_name"`
	Role        string  `json:"role"`
	TotalSalary float64 `json:"total_salary"`
	IsActive    bool    `json:"is_active"`
}

type MonthlySalaryDetail struct {
	Month       string  `json:"month"`
	Salary      float64 `json:"salary"`
	Loan        float64 `json:"loan"`
	NetSalary   float64 `json:"net_salary"`
	GrossSalary float64 `json:"gross_salary"`
	Status      string  `json:"status"`
	CreatedAt   string  `json:"created_at"`
}

func (r *memberRepository) GetAllMembersWithSalaryInfo(year string, month string, orderBy string) ([]MemberSalaryInfo, error) {
	var results []MemberSalaryInfo
	
	// Map month number to Indonesian month name
	monthNames := map[string]string{
		"01": "Januari",
		"02": "Februari",
		"03": "Maret",
		"04": "April",
		"05": "Mei",
		"06": "Juni",
		"07": "Juli",
		"08": "Agustus",
		"09": "September",
		"10": "Oktober",
		"11": "November",
		"12": "Desember",
	}
	
	// Build conditional SUM based on filters
	var selectQuery string
	var filterPattern string
	
	if year != "" && month != "" {
		// Format: "Januari 2025"
		monthName := monthNames[month]
		filterPattern = monthName + " " + year
		selectQuery = "members.id as member_id, members.full_name, members.role, members.is_active, COALESCE(SUM(CASE WHEN salaries.status = 'Paid' AND salaries.month = ? THEN salaries.salary ELSE 0 END), 0) as total_salary"
		println("Filter by specific month:", filterPattern)
	} else if year != "" {
		// Match any month with year: "% 2025"
		filterPattern = "% " + year
		selectQuery = "members.id as member_id, members.full_name, members.role, members.is_active, COALESCE(SUM(CASE WHEN salaries.status = 'Paid' AND salaries.month LIKE ? THEN salaries.salary ELSE 0 END), 0) as total_salary"
		println("Filter by year:", filterPattern)
	} else {
		selectQuery = "members.id as member_id, members.full_name, members.role, members.is_active, COALESCE(SUM(CASE WHEN salaries.status = 'Paid' THEN salaries.salary ELSE 0 END), 0) as total_salary"
		println("No filter applied")
	}
	
	query := r.db.Table("members").
		Joins("LEFT JOIN salaries ON salaries.member_id = members.id").
		Group("members.id, members.full_name, members.role, members.is_active")
	
	// Apply select with parameters
	if year != "" && month != "" {
		query = query.Select(selectQuery, filterPattern)
	} else if year != "" {
		query = query.Select(selectQuery, filterPattern)
	} else {
		query = query.Select(selectQuery)
	}
	
	// Default descending by total_salary
	if orderBy == "asc" {
		query = query.Order("total_salary ASC")
	} else {
		query = query.Order("total_salary DESC")
	}
	
	// Enable debug to see SQL
	err := query.Debug().Scan(&results).Error
	
	println("Query executed, found", len(results), "members")
	
	return results, err
}

func (r *memberRepository) GetMemberMonthlySalaryDetails(memberID string, year string) ([]MonthlySalaryDetail, error) {
	var results []MonthlySalaryDetail
	
	query := r.db.Table("salaries").
		Select("month, salary, loan, net_salary, gross_salary, status, created_at").
		Where("member_id = ?", memberID)
	
	if year != "" {
		// Match format "Bulan YYYY" like "Maret 2025"
		query = query.Where("month LIKE ?", "% "+year)
	}
	
	// Order by created_at since month is text format
	query = query.Order("created_at DESC")
	
	err := query.Scan(&results).Error
	return results, err
}
