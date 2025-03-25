// internal/entity/activity.go
package entity

import "time"

type ActivityType string

const (
	ActivityIncome  ActivityType = "income"
	ActivityExpense ActivityType = "expense"
	ActivityMember  ActivityType = "member"
	ActivityUpdate  ActivityType = "update"
	// ActivityProject   ActivityType = "project"
	// ActivitySalary    ActivityType = "salary"
	// ActivityInventory ActivityType = "inventory"
	// ActivityKasbon    ActivityType = "kasbon"
)

type Activity struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Type        ActivityType `json:"type"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Timestamp   time.Time    `json:"timestamp"`
}
