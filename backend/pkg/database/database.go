package database

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/entity"
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func NewMySQLDB(config *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.DBUser,
		config.DBPassword,
		config.DBHost,
		config.DBPort,
		config.DBName,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Auto migrate entities
	// pkg/database/database.go
	db.AutoMigrate(
		&entity.User{},
		&entity.Member{},
		&entity.Project{},
		&entity.Salary{}, // Tambahkan ini
		&entity.ApiKey{},
	)

	return db, nil
}
