// Package deepseek memanggil API vision OpenAI-compatible (DeepSeek, Ollama, vLLM, dll) untuk ekstraksi invoice dari gambar.
package deepseek

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"dashboardadminimb/internal/gemini"
)

// openAICompatible request/response (partial)
type chatMessage struct {
	Role    string        `json:"role"`
	Content []interface{} `json:"content"`
}

type chatRequest struct {
	Model    string         `json:"model"`
	Messages []chatMessage  `json:"messages"`
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// isOllama heuristik: base URL typical Ollama (localhost:11434 atau mengandung 11434/ollama).
func isOllama(baseURL string) bool {
	u := strings.ToLower(baseURL)
	return strings.Contains(u, "11434") || strings.Contains(u, "ollama")
}

// ollamaChatRequest/Response untuk native POST /api/chat (images = base64, format = json).
type ollamaChatRequest struct {
	Model    string        `json:"model"`
	Messages []ollamaMsg   `json:"messages"`
	Stream   bool          `json:"stream"`
	Format   string        `json:"format,omitempty"`
}
type ollamaMsg struct {
	Role    string   `json:"role"`
	Content string   `json:"content"`
	Images  []string `json:"images,omitempty"`
}
type ollamaChatResponse struct {
	Message struct {
		Content string `json:"content"`
	} `json:"message"`
}

func callVision(baseURL, apiKey, model string, imageData []byte, mimeType string, prompt string) (string, error) {
	baseURL = strings.TrimSuffix(baseURL, "/")
	if model == "" {
		model = "llava"
	}
	b64 := base64.StdEncoding.EncodeToString(imageData)

	if isOllama(baseURL) {
		// Ollama native /api/chat: images = []base64, format json agar output JSON
		url := baseURL + "/api/chat"
		body := ollamaChatRequest{
			Model:    model,
			Stream:   false,
			Format:   "json",
			Messages: []ollamaMsg{{Role: "user", Content: prompt, Images: []string{b64}}},
		}
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return "", err
		}
		req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonBody))
		if err != nil {
			return "", err
		}
		req.Header.Set("Content-Type", "application/json")
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			return "", fmt.Errorf("ollama request: %w", err)
		}
		defer resp.Body.Close()
		respBody, _ := io.ReadAll(resp.Body)
		if resp.StatusCode != http.StatusOK {
			return "", fmt.Errorf("ollama api error %d: %s", resp.StatusCode, string(respBody))
		}
		var ollamaResp ollamaChatResponse
		if err := json.Unmarshal(respBody, &ollamaResp); err != nil {
			return "", fmt.Errorf("ollama response parse: %w", err)
		}
		text := strings.TrimSpace(ollamaResp.Message.Content)
		if text == "" {
			return "", fmt.Errorf("ollama tidak mengembalikan teks")
		}
		return extractJSONFromText(text), nil
	}

	// OpenAI-compatible /v1/chat/completions
	url := baseURL + "/v1/chat/completions"
	if mimeType == "" {
		mimeType = "image/jpeg"
	}
	dataURL := "data:" + mimeType + ";base64," + b64
	content := []interface{}{
		map[string]interface{}{
			"type":      "image_url",
			"image_url": map[string]string{"url": dataURL},
		},
		map[string]interface{}{
			"type": "text",
			"text": prompt,
		},
	}
	body := chatRequest{
		Model:    model,
		Messages: []chatMessage{{Role: "user", Content: content}},
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", err
	}
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("vision request: %w", err)
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("vision api error %d: %s", resp.StatusCode, string(respBody))
	}
	var chatResp chatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", err
	}
	if len(chatResp.Choices) == 0 || chatResp.Choices[0].Message.Content == "" {
		return "", fmt.Errorf("tidak mengembalikan teks")
	}
	text := chatResp.Choices[0].Message.Content
	return extractJSONFromText(text), nil
}

func extractJSONFromText(text string) string {
	text = strings.TrimSpace(text)
	if len(text) >= 7 && strings.HasPrefix(text, "```json") {
		text = strings.TrimSpace(text[7:])
	} else if len(text) >= 3 && strings.HasPrefix(text, "```") {
		text = strings.TrimSpace(text[3:])
	}
	if idx := strings.Index(text, "{"); idx >= 0 {
		text = text[idx:]
	}
	if idx := strings.LastIndex(text, "}"); idx >= 0 {
		text = text[:idx+1]
	}
	// Hapus trailing comma sebelum } agar valid di Go (e.g. "unit": "hari", } -> })
	if idx := strings.LastIndex(text, "}"); idx >= 0 {
		tail := strings.TrimSpace(text[idx+1:])
		body := strings.TrimRight(strings.TrimSpace(text[:idx]), ",\n\r\t ")
		text = body + "}" + tail
	}
	return text
}

// ExtractInvoiceFromImage memanggil model vision dan mengembalikan data invoice (format sama dengan Gemini).
func ExtractInvoiceFromImage(baseURL, apiKey, model string, imageData []byte, mimeType string) (*gemini.ExtractInvoiceResponse, error) {
	text, err := callVision(baseURL, apiKey, model, imageData, mimeType, gemini.ExtractPromptForDeepSeek())
	if err != nil {
		return nil, err
	}
	var out gemini.ExtractInvoiceResponse
	if err := json.Unmarshal([]byte(text), &out); err != nil {
		return nil, fmt.Errorf("parse json: %w (raw: %s)", err, text)
	}
	out.InvoiceDate = gemini.NormalizeRowDate(out.InvoiceDate)
	for i := range out.Items {
		out.Items[i].RowDate = gemini.NormalizeRowDate(out.Items[i].RowDate)
	}
	return &out, nil
}

// ExtractOneDayFromImage satu gambar = satu hari (satu baris item).
func ExtractOneDayFromImage(baseURL, apiKey, model string, imageData []byte, mimeType string, quantityUnit string, useBBM bool) (*gemini.ExtractOneDayResponse, error) {
	prompt := gemini.BuildOneDayPromptForDeepSeek(quantityUnit, useBBM)
	if isOllama(baseURL) {
		prompt = gemini.BuildOneDayPromptForOllama(quantityUnit, useBBM)
	}
	text, err := callVision(baseURL, apiKey, model, imageData, mimeType, prompt)
	if err != nil {
		return nil, err
	}
	var out gemini.ExtractOneDayResponse
	if err := json.Unmarshal([]byte(text), &out); err != nil {
		return nil, fmt.Errorf("parse json: %w (raw: %s)", err, text)
	}
	out.RowDate = gemini.NormalizeRowDate(out.RowDate)
	if out.Days == 0 && out.Quantity != 0 {
		out.Days = out.Quantity
	}
	if out.Quantity == 0 && out.Days != 0 {
		out.Quantity = out.Days
	}
	return &out, nil
}

// ExtractDateAndDaysFromImage ekstrak tanggal + quantity + unit (hari|jam). Pemanggil lakukan konversi jam↔hari.
func ExtractDateAndDaysFromImage(baseURL, apiKey, model string, imageData []byte, mimeType string, columnDescriptions []string) (*gemini.ExtractRowResponse, error) {
	prompt := gemini.BuildRowOnlyPromptForDeepSeek(columnDescriptions)
	if isOllama(baseURL) {
		prompt = gemini.BuildRowOnlyPromptForOllama(columnDescriptions)
	}
	text, err := callVision(baseURL, apiKey, model, imageData, mimeType, prompt)
	if err != nil {
		return nil, err
	}
	var out gemini.ExtractRowResponse
	if err := json.Unmarshal([]byte(text), &out); err != nil {
		return nil, fmt.Errorf("parse json: %w (raw: %s)", err, text)
	}
	out.RowDate = gemini.NormalizeRowDate(out.RowDate)
	if out.Quantity == 0 && out.Days != 0 {
		out.Quantity = out.Days
	}
	u := strings.ToLower(strings.TrimSpace(out.Unit))
	if u == "jam" {
		out.Unit = "jam"
	} else {
		out.Unit = "hari"
	}
	return &out, nil
}

// ollamaGenerateRequest/Response untuk POST /api/generate (text-only, no image).
type ollamaGenerateRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
	Format string `json:"format,omitempty"`
}
type ollamaGenerateResponse struct {
	Response string `json:"response"`
}

// CallOllamaGenerate memanggil Ollama POST /api/generate (teks saja). Gunakan untuk parser OCR→JSON (mis. timesheet).
// baseURL contoh: http://localhost:11434. useJSON=true set format:"json" jika model mendukung.
func CallOllamaGenerate(baseURL, model, prompt string, useJSON bool) (string, error) {
	baseURL = strings.TrimSuffix(baseURL, "/")
	if model == "" {
		model = "qwen2.5:7b"
	}
	body := ollamaGenerateRequest{
		Model:  model,
		Prompt: prompt,
		Stream: false,
	}
	if useJSON {
		body.Format = "json"
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", err
	}
	url := baseURL + "/api/generate"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama generate: %w", err)
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ollama generate %d: %s", resp.StatusCode, string(respBody))
	}
	var genResp ollamaGenerateResponse
	if err := json.Unmarshal(respBody, &genResp); err != nil {
		return "", fmt.Errorf("ollama response parse: %w", err)
	}
	return strings.TrimSpace(genResp.Response), nil
}
