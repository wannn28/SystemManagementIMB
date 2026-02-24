// Package ocr menyediakan ekstraksi teks dari gambar (Tesseract atau script eksternal).
package ocr

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// Runner mengembalikan teks dari gambar.
type Runner interface {
	Run(imageData []byte, mimeType string) (string, error)
}

// NewTesseractRunner membuat runner yang memanggil tesseract CLI.
// tesseractPath = "tesseract" atau path penuh ke binary.
func NewTesseractRunner(tesseractPath string) (Runner, error) {
	path := strings.TrimSpace(tesseractPath)
	if path == "" {
		return nil, fmt.Errorf("TESSERACT_PATH kosong")
	}
	return &tesseractRunner{path: path}, nil
}

type tesseractRunner struct {
	path string
}

func (t *tesseractRunner) Run(imageData []byte, mimeType string) (string, error) {
	ext := ".png"
	if strings.HasPrefix(mimeType, "image/jpeg") || strings.HasPrefix(mimeType, "image/jpg") {
		ext = ".jpg"
	}
	tmpFile, err := os.CreateTemp("", "ocr-*"+ext)
	if err != nil {
		return "", fmt.Errorf("ocr temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()
	if _, err := tmpFile.Write(imageData); err != nil {
		return "", fmt.Errorf("ocr write temp: %w", err)
	}
	if err := tmpFile.Sync(); err != nil {
		return "", err
	}
	// tesseract input stdout -l ind+eng
	cmd := exec.Command(t.path, tmpFile.Name(), "stdout", "-l", "ind+eng")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("tesseract: %w; stderr: %s", err, stderr.String())
	}
	return strings.TrimSpace(stdout.String()), nil
}

// NoOPRunner mengembalikan teks kosong (untuk uji tanpa OCR).
type NoOPRunner struct{}

func (NoOPRunner) Run([]byte, string) (string, error) { return "", nil }

// ResolveRunner mengembalikan Runner dari config. Jika OCR_SCRIPT_PATH diisi, pakai ScriptRunner; else jika TESSERACT_PATH diisi pakai Tesseract; else nil (OCR tidak tersedia).
func ResolveRunner(tesseractPath, scriptPath string) (Runner, error) {
	if strings.TrimSpace(scriptPath) != "" {
		return NewScriptRunner(scriptPath)
	}
	if strings.TrimSpace(tesseractPath) != "" {
		return NewTesseractRunner(tesseractPath)
	}
	return nil, nil
}

// ScriptRunner memanggil script eksternal: stdin = image bytes, stdout = teks. Untuk PaddleOCR/EasyOCR.
func NewScriptRunner(scriptPath string) (Runner, error) {
	p := strings.TrimSpace(scriptPath)
	if p == "" {
		return nil, fmt.Errorf("OCR_SCRIPT_PATH kosong")
	}
	if !filepath.IsAbs(p) {
		// relatif ke working dir
	}
	return &scriptRunner{path: p}, nil
}

type scriptRunner struct {
	path string
}

func (s *scriptRunner) Run(imageData []byte, mimeType string) (string, error) {
	cmd := exec.Command(s.path)
	cmd.Stdin = bytes.NewReader(imageData)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("ocr script: %w; stderr: %s", err, stderr.String())
	}
	return strings.TrimSpace(stdout.String()), nil
}
