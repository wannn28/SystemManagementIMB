package gemini

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

const (
	geminiAPIBase   = "https://generativelanguage.googleapis.com/v1beta/models"
	defaultGeminiModel = "gemini-2.5-flash"
)

// ExtractInvoiceResponse adalah struktur data yang diharapkan dari Gemini untuk pre-fill form invoice (satu gambar = banyak item).
type ExtractInvoiceResponse struct {
	CustomerName    string `json:"customer_name"`
	CustomerPhone   string `json:"customer_phone"`
	CustomerAddress string `json:"customer_address"`
	InvoiceDate     string `json:"invoice_date"` // YYYY-MM-DD
	Notes           string `json:"notes"`
	Items           []struct {
		ItemName string  `json:"item_name"`
		Quantity float64 `json:"quantity"`
		Days     float64 `json:"days"`
		Price    float64 `json:"price"`
		RowDate  string  `json:"row_date"`
	} `json:"items"`
	Total float64 `json:"total"`
}

// ExtractOneDayResponse untuk satu gambar = satu hari (satu baris item). Dipakai saat banyak gambar (1 nota = 1 hari).
type ExtractOneDayResponse struct {
	RowDate         string  `json:"row_date"`       // YYYY-MM-DD
	ItemName        string  `json:"item_name"`      // nama unit, e.g. Grader, Dump Truck 10 Roda
	Quantity        float64 `json:"quantity"`       // jumlah (hari atau jam)
	Days            float64 `json:"days"`           // sama dengan quantity untuk satuan hari
	Price           float64 `json:"price"`          // harga per hari/jam
	BbmQuantity     float64 `json:"bbm_quantity"`   // jerigen BBM jika ada
	BbmUnitPrice    float64 `json:"bbm_unit_price"` // harga per jerigen
	CustomerName    string  `json:"customer_name"`
	CustomerAddress string  `json:"customer_address"`
	Location        string  `json:"location"`
	Notes           string  `json:"notes"`
}

// Gemini generateContent request/response (partial)
type geminiRequest struct {
	Contents []struct {
		Parts []interface{} `json:"parts"`
	} `json:"contents"`
	GenerationConfig struct {
		ResponseMIMEType string `json:"response_mime_type"`
	} `json:"generationConfig"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

const extractPrompt = `Gambar ini adalah nota, timesheet, atau dokumen tagihan sewa alat berat. 
Ekstrak data berikut ke JSON saja (tanpa markdown, tanpa penjelasan). Gunakan format ini persis:
{
  "customer_name": "nama perusahaan atau pelanggan",
  "customer_phone": "nomor telepon jika ada",
  "customer_address": "alamat jika ada",
  "invoice_date": "YYYY-MM-DD",
  "notes": "catatan jika ada",
  "items": [
    {
      "item_name": "nama unit atau keterangan (contoh: Grader, Dump Truck 10 Roda)",
      "quantity": 1,
      "days": 1.0,
      "price": 0,
      "row_date": ""
    }
  ],
  "total": 0
}
Untuk setiap baris item di dokumen: isi item_name, days (atau quantity) dengan angka hari/jam, price dengan harga per hari/jam. Tanggal: format bisa DD/MM/YY, DD/MM/YYYY, DD.MM.YY, atau DD-MM.YY (selalu urutan hari-bulan-tahun). Contoh: 01/02/26, 01/02/2026, 01-02.26 = 1 Feb 2026. Jika tahun dua digit (YY), dua digit itu TAHUN (26=2026), BUKAN hari—jangan baca 01/02/26 sebagai 26 Februari. Row_date dan invoice_date keluarkan YYYY-MM-DD. Total adalah total keseluruhan jika terlihat. Jika ada beberapa unit berbeda, buat satu item per baris. Hanya keluarkan JSON valid.`

// buildOneDayPrompt membuat prompt untuk ekstraksi satu gambar = satu hari.
func buildOneDayPrompt(quantityUnit string, useBBM bool) string {
	unitLabel := "hari"
	if quantityUnit == "jam" {
		unitLabel = "jam"
	}
	bbmPart := ",\n  \"bbm_quantity\": 0,\n  \"bbm_unit_price\": 0"
	bbmHint := " Jika ada BBM/jerigen di dokumen isi bbm_quantity dan bbm_unit_price."
	if !useBBM {
		bbmHint = " Abaikan BBM, tetap 0."
	}
	return fmt.Sprintf(`Gambar ini adalah SATU HARI nota/timesheet sewa alat berat (1 gambar = 1 hari).
Ekstrak ke JSON saja (tanpa markdown):
{
  "row_date": "YYYY-MM-DD",
  "item_name": "nama unit (contoh: Grader, Dump Truck 10 Roda)",
  "quantity": 0,
  "days": 0,
  "price": 0%s,
  "customer_name": "",
  "customer_address": "",
  "location": "",
  "notes": ""
}
PENTING - Tanggal: Cari di kolom "Hari" atau tanggal di dokumen. Format DD/MM/YY, DD/MM/YYYY, DD.MM.YY, atau DD-MM.YY (urutan hari-bulan-tahun). Contoh: 01/02/26, 01/02/2026, 01-02.26 = 1 Feb 2026. Jika YY (dua digit), itu TAHUN (26=2026), bukan hari—01/02/26 = 1 Februari 2026, bukan 26 Februari. row_date keluarkan YYYY-MM-DD. item_name = nama alat/unit. quantity dan days = jumlah %s (bisa 0.5, 1, 8 untuk jam). price = harga per %s.%s
Hanya keluarkan JSON valid.`, bbmPart, unitLabel, unitLabel, bbmHint)
}

// ExtractRowResponse tanggal + quantity dan unit (hari atau jam) agar bisa konversi di backend.
// Days dipakai bila Gemini mengembalikan "days" saja (backward compatible).
type ExtractRowResponse struct {
	RowDate  string  `json:"row_date"` // YYYY-MM-DD
	Quantity float64 `json:"quantity"` // jumlah (hari atau jam tergantung unit)
	Days     float64 `json:"days"`     // alternatif dari quantity
	Unit     string  `json:"unit"`     // "hari" atau "jam"
}

func buildRowOnlyPrompt() string {
	return `Gambar ini adalah nota atau timesheet sewa alat berat (TIME SHEET).
Ekstrak ke JSON saja (tanpa markdown):
{
  "row_date": "YYYY-MM-DD",
  "quantity": 0,
  "unit": "hari"
}
PENTING - Tanggal: Di kolom "Hari" format DD/MM/YY, DD/MM/YYYY, DD.MM.YY, atau DD-MM.YY (urutan hari-bulan-tahun). Contoh: 01/02/26, 01/02/2026, 01-02.26 → 2026-02-01. Jika YY (dua digit) = TAHUN (26=2026), bukan hari—01/02/26 = 1 Feb 2026, bukan 26 Feb. row_date keluarkan YYYY-MM-DD. quantity = jumlah hari/jam ("8 Jam"=8, "1 Hari"=1). unit = "hari" atau "jam". Jika tidak ada tanggal gunakan "".
Hanya keluarkan JSON valid.`
}

// ExtractPromptForDeepSeek mengembalikan prompt ekstraksi invoice penuh (untuk provider lain).
func ExtractPromptForDeepSeek() string { return extractPrompt }

// BuildOneDayPromptForDeepSeek mengembalikan prompt satu gambar = satu hari.
func BuildOneDayPromptForDeepSeek(quantityUnit string, useBBM bool) string {
	return buildOneDayPrompt(quantityUnit, useBBM)
}

// buildOneDayPromptOllama prompt satu-hari lebih eksplisit untuk Ollama/LLaVA.
func buildOneDayPromptOllama(quantityUnit string, useBBM bool) string {
	unitLabel := "hari"
	if quantityUnit == "jam" {
		unitLabel = "jam"
	}
	bbmExtra := ""
	if useBBM {
		bbmExtra = `,"bbm_quantity":0,"bbm_unit_price":0`
	}
	return fmt.Sprintf(`Satu foto = SATU HARI timesheet/nota sewa alat berat. Output HANYA JSON valid.

Langkah: 1) Tanggal: cari di samping "Hari". Format DD/MM/YY, DD/MM/YYYY, DD.MM.YY, atau DD-MM.YY (hari-bulan-tahun). Contoh: 01/02/26, 01/02/2026, 01-02.26 → "2026-02-01". Jika YY dua digit = tahun (26=2026), bukan hari. row_date = YYYY-MM-DD. 2) item_name = nama alat (Excavator, Dump Truck, dll). 3) quantity dan days = jumlah %s (angka). 4) price = harga per %s jika terlihat.
Format: {"row_date":"YYYY-MM-DD","item_name":"...","quantity":0,"days":0,"price":0,"customer_name":"","customer_address":"","location":"","notes":""%s}
Hanya JSON, tidak markdown.`, unitLabel, unitLabel, bbmExtra)
}

// BuildOneDayPromptForOllama prompt satu-hari untuk Ollama/LLaVA.
func BuildOneDayPromptForOllama(quantityUnit string, useBBM bool) string {
	return buildOneDayPromptOllama(quantityUnit, useBBM)
}

// BuildRowOnlyPromptForDeepSeek mengembalikan prompt ekstraksi row (tanggal + quantity + unit).
func BuildRowOnlyPromptForDeepSeek() string { return buildRowOnlyPrompt() }

// buildRowOnlyPromptOllama prompt lebih eksplisit untuk model lokal (Ollama/LLaVA) agar hasil lebih akurat.
func buildRowOnlyPromptOllama() string {
	return `Kamu ekstrak data dari foto TIMESHEET / nota sewa alat berat. Output HANYA JSON valid, tanpa teks lain.

Langkah:
1) Cari TANGGAL di dokumen (di kolom "Hari"). Format DD/MM/YY, DD/MM/YYYY, DD.MM.YY, atau DD-MM.YY (urutan selalu hari-bulan-tahun). Contoh: 01/02/26, 01/02/2026, 01-02.26. Jika tahun dua digit (YY) = 2026 untuk 26, BUKAN hari—01/02/26 = 1 Feb 2026, bukan 26 Feb.
2) Konversi ke YYYY-MM-DD: 01/02/26 → 2026-02-01, 01/02/2026 → 2026-02-01, 01-02.26 → 2026-02-01.
3) Cari jumlah kerja: "8 Jam" = 8 unit jam, "1 Hari" = 1 unit hari. Isi quantity dengan angka, unit dengan "jam" atau "hari".
4) Keluarkan tepat format ini:
{"row_date": "YYYY-MM-DD", "quantity": angka, "unit": "hari" atau "jam"}

Contoh output: {"row_date": "2026-02-03", "quantity": 8, "unit": "jam"}
Jika tanggal tidak ketemu, row_date = "". Hanya JSON, tidak ada markdown.`
}

// BuildRowOnlyPromptForOllama prompt lebih eksplisit untuk Ollama/LLaVA (model lokal).
func BuildRowOnlyPromptForOllama() string { return buildRowOnlyPromptOllama() }

// extractJSONFromText mengambil objek JSON dari teks yang mungkin dibungkus markdown (```json ... ```) atau ada teks lain.
func extractJSONFromText(text string) string {
	text = trimSpace(text)
	if len(text) >= 7 && strings.HasPrefix(text, "```json") {
		text = trimSpace(text[7:])
	} else if len(text) >= 3 && strings.HasPrefix(text, "```") {
		text = trimSpace(text[3:])
	}
	if idx := strings.Index(text, "{"); idx >= 0 {
		text = text[idx:]
	}
	if idx := strings.LastIndex(text, "}"); idx >= 0 {
		text = text[:idx+1]
	}
	return text
}

// NormalizeRowDate mengubah tanggal dari timesheet (DD/MM/YY, DD/MM/YYYY, DD.MM.YY, DD-MM.YY, dll.) ke YYYY-MM-DD.
// Supaya tampilan di form invoice sesuai dengan nota. Kosong tetap kosong.
func NormalizeRowDate(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	// Sudah YYYY-MM-DD
	if len(s) >= 10 && s[4] == '-' && s[7] == '-' {
		if _, err := strconv.Atoi(s[:4]); err == nil {
			return s[:10]
		}
	}
	// DD/MM/YY atau DD/MM/YYYY
	if strings.Count(s, "/") >= 2 {
		parts := strings.Split(s, "/")
		if len(parts) >= 3 {
			d, m, y := strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1]), strings.TrimSpace(parts[2])
			if len(y) == 2 {
				y = "20" + y
			}
			if dd, _ := strconv.Atoi(d); dd >= 1 && dd <= 31 {
				if mm, _ := strconv.Atoi(m); mm >= 1 && mm <= 12 {
					if yy, _ := strconv.Atoi(y); yy >= 2000 && yy <= 2100 {
						return fmt.Sprintf("%04d-%02d-%02d", yy, mm, dd)
					}
				}
			}
		}
	}
	// DD.MM.YY atau DD.MM.YYYY
	if strings.Count(s, ".") >= 2 {
		parts := strings.Split(s, ".")
		if len(parts) >= 3 {
			d, m, y := strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1]), strings.TrimSpace(parts[2])
			if len(y) == 2 {
				y = "20" + y
			}
			if dd, _ := strconv.Atoi(d); dd >= 1 && dd <= 31 {
				if mm, _ := strconv.Atoi(m); mm >= 1 && mm <= 12 {
					if yy, _ := strconv.Atoi(y); yy >= 2000 && yy <= 2100 {
						return fmt.Sprintf("%04d-%02d-%02d", yy, mm, dd)
					}
				}
			}
		}
	}
	// DD-MM.YY (mis. 01-02.26)
	if strings.Contains(s, "-") && strings.Contains(s, ".") {
		before, after, ok := strings.Cut(s, ".")
		if ok && len(strings.TrimSpace(after)) == 2 {
			p1, p2, ok2 := strings.Cut(before, "-")
			if ok2 {
				d, m, y := strings.TrimSpace(p1), strings.TrimSpace(p2), "20"+strings.TrimSpace(after)
				if dd, _ := strconv.Atoi(d); dd >= 1 && dd <= 31 {
					if mm, _ := strconv.Atoi(m); mm >= 1 && mm <= 12 {
						if yy, _ := strconv.Atoi(y); yy >= 2000 && yy <= 2100 {
							return fmt.Sprintf("%04d-%02d-%02d", yy, mm, dd)
						}
					}
				}
			}
		}
	}
	return s
}

// ExtractDateAndDaysFromImage ekstrak tanggal + quantity dan unit (hari|jam). Pemanggil konversi jam↔hari.
func ExtractDateAndDaysFromImage(apiKey, model string, imageData []byte, mimeType string) (*ExtractRowResponse, error) {
	text, err := callGemini(apiKey, model, imageData, mimeType, buildRowOnlyPrompt())
	if err != nil {
		return nil, err
	}
	jsonStr := extractJSONFromText(text)
	var out ExtractRowResponse
	if err := json.Unmarshal([]byte(jsonStr), &out); err != nil {
		return nil, fmt.Errorf("parse json dari gemini: %w (raw: %s)", err, text)
	}
	out.RowDate = NormalizeRowDate(out.RowDate)
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

// callGemini mengirim gambar + prompt ke Gemini, mengembalikan teks JSON yang sudah di-trim.
// model: kosong = gemini-2.5-flash. Contoh: gemini-2.5-flash-lite (limit gratis lebih besar).
func callGemini(apiKey, model string, imageData []byte, mimeType string, prompt string) (string, error) {
	if apiKey == "" {
		return "", fmt.Errorf("GEMINI_API_KEY tidak diisi")
	}
	if model == "" {
		model = defaultGeminiModel
	}
	if mimeType == "" {
		mimeType = "image/jpeg"
	}
	b64 := base64.StdEncoding.EncodeToString(imageData)
	parts := []interface{}{
		map[string]interface{}{
			"inline_data": map[string]interface{}{
				"mime_type": mimeType,
				"data":      b64,
			},
		},
		map[string]interface{}{"text": prompt},
	}
	body := map[string]interface{}{
		"contents":         []map[string]interface{}{{"parts": parts}},
		"generationConfig": map[string]interface{}{"response_mime_type": "application/json"},
	}
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return "", err
	}
	url := geminiAPIBase + "/" + model + ":generateContent?key=" + apiKey
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini api error %d: %s", resp.StatusCode, string(respBody))
	}
	var gemResp geminiResponse
	if err := json.Unmarshal(respBody, &gemResp); err != nil {
		return "", err
	}
	if len(gemResp.Candidates) == 0 || len(gemResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini tidak mengembalikan teks")
	}
	text := gemResp.Candidates[0].Content.Parts[0].Text
	if len(text) >= 7 && text[:7] == "```json" {
		text = text[7:]
	}
	if len(text) >= 3 && text[len(text)-3:] == "```" {
		text = text[:len(text)-3]
	}
	return trimSpace(text), nil
}

// ExtractInvoiceFromImage mengirim gambar ke Gemini dan mengembalikan data terstruktur untuk pre-fill invoice.
func ExtractInvoiceFromImage(apiKey, model string, imageData []byte, mimeType string) (*ExtractInvoiceResponse, error) {
	text, err := callGemini(apiKey, model, imageData, mimeType, extractPrompt)
	if err != nil {
		return nil, err
	}
	var out ExtractInvoiceResponse
	if err := json.Unmarshal([]byte(text), &out); err != nil {
		return nil, fmt.Errorf("parse json dari gemini: %w (raw: %s)", err, text)
	}
	out.InvoiceDate = NormalizeRowDate(out.InvoiceDate)
	for i := range out.Items {
		out.Items[i].RowDate = NormalizeRowDate(out.Items[i].RowDate)
	}
	return &out, nil
}

// ExtractOneDayFromImage ekstrak satu gambar = satu hari (satu baris). Dipakai untuk banyak gambar (1 nota = 1 hari).
func ExtractOneDayFromImage(apiKey, model string, imageData []byte, mimeType string, quantityUnit string, useBBM bool) (*ExtractOneDayResponse, error) {
	if quantityUnit == "" {
		quantityUnit = "hari"
	}
	prompt := buildOneDayPrompt(quantityUnit, useBBM)
	text, err := callGemini(apiKey, model, imageData, mimeType, prompt)
	if err != nil {
		return nil, err
	}
	var out ExtractOneDayResponse
	if err := json.Unmarshal([]byte(text), &out); err != nil {
		return nil, fmt.Errorf("parse json dari gemini: %w (raw: %s)", err, text)
	}
	out.RowDate = NormalizeRowDate(out.RowDate)
	// Normalize: days = quantity if days 0
	if out.Days == 0 && out.Quantity != 0 {
		out.Days = out.Quantity
	}
	if out.Quantity == 0 && out.Days != 0 {
		out.Quantity = out.Days
	}
	return &out, nil
}

func trimSpace(s string) string {
	start := 0
	for start < len(s) && (s[start] == ' ' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	end := len(s)
	for end > start && (s[end-1] == ' ' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}
	return s[start:end]
}
