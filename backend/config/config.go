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
	JWTSecret   string `mapstructure:"JWT_SECRET"`
	JWTExpiry   string `mapstructure:"JWT_EXPIRY"`
	// Ekstraksi dari gambar: gemini (Google) atau deepseek (server lokal/OpenAI-compatible)
	ExtractProvider  string `mapstructure:"EXTRACT_PROVIDER"`  // gemini | deepseek
	GeminiAPIKey     string `mapstructure:"GEMINI_API_KEY"`
	GeminiModel      string `mapstructure:"GEMINI_MODEL"`    // kosong = gemini-2.5-flash. Untuk limit lebih: gemini-2.5-flash-lite (≈1000 RPD gratis)
	DeepSeekBaseURL  string `mapstructure:"DEEPSEEK_BASE_URL"`  // e.g. http://localhost:11434 (Ollama) atau http://localhost:8000 (vLLM)
	DeepSeekAPIKey   string `mapstructure:"DEEPSEEK_API_KEY"`   // opsional untuk server lokal
	DeepSeekModel    string `mapstructure:"DEEPSEEK_MODEL"`     // opsional, e.g. llava, qwen2.5vl:7b
	// OCR untuk pipeline timesheet: gambar → OCR → LLM. Kosong = OCR dinonaktifkan untuk from-image.
	TesseractPath string `mapstructure:"TESSERACT_PATH"` // e.g. "tesseract" atau path ke tesseract.exe. Pakai untuk OCR teks dari gambar.
	OCRScriptPath string `mapstructure:"OCR_SCRIPT_PATH"` // opsional: script (python dll) baca gambar dari stdin, print teks ke stdout. Prioritas di atas Tesseract jika diisi.
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
