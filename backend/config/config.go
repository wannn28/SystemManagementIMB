package config

import (
	"github.com/spf13/viper"
)

// config/config.go
type Config struct {
	DBHost     string `mapstructure:"DB_HOST"`
	DBPort     string `mapstructure:"DB_PORT"`
	DBUser     string `mapstructure:"DB_USER"`
	DBPassword string `mapstructure:"DB_PASSWORD"`
	DBName     string `mapstructure:"DB_NAME"`
	Port       string `mapstructure:"PORT"`
	UploadDir  string `mapstructure:"UPLOAD_DIR"`
	BaseURL    string `mapstructure:"BASE_URL"`
	JWTSecret  string `mapstructure:"JWT_SECRET"`
	JWTExpiry  string `mapstructure:"JWT_EXPIRY"`
}

func LoadConfig() (config Config, err error) {
	viper.AddConfigPath("./config")
	viper.SetConfigName("app")
	viper.SetConfigType("env")

	viper.AutomaticEnv()

	err = viper.ReadInConfig()
	if err != nil {
		return
	}

	err = viper.Unmarshal(&config)
	return
}
