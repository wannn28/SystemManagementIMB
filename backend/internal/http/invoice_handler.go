package http

import (
	"dashboardadminimb/config"
	"dashboardadminimb/internal/deepseek"
	"dashboardadminimb/internal/entity"
	"dashboardadminimb/internal/gemini"
	"dashboardadminimb/internal/imagepreprocess"
	"dashboardadminimb/internal/ocr"
	"dashboardadminimb/internal/service"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"dashboardadminimb/pkg/response"
)

// normalisasi due_date: kosong atau invalid (tahun < 1000) -> nil agar MySQL tidak error
func normalizeDueDate(s *string) *string {
	if s == nil || *s == "" {
		return nil
	}
	datePart := *s
	if len(datePart) < 10 {
		return nil
	}
	datePart = datePart[:10]
	t, err := time.Parse("2006-01-02", datePart)
	if err != nil {
		return nil
	}
	if t.Year() < 1000 {
		return nil
	}
	return s
}

type InvoiceHandler struct {
	service service.InvoiceService
	cfg     config.Config
}

func NewInvoiceHandler(service service.InvoiceService, cfg config.Config) *InvoiceHandler {
	return &InvoiceHandler{service: service, cfg: cfg}
}

func (h *InvoiceHandler) Create(c echo.Context) error {
	var inv entity.Invoice
	if err := c.Bind(&inv); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	if inv.InvoiceNumber == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "invoice_number is required"))
	}
	if inv.CustomerName == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "customer_name is required"))
	}
	if inv.TemplateID == 0 {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "template_id is required"))
	}
	// MySQL DATE tidak menerima string kosong atau invalid (e.g. 0022-02-22); simpan NULL
	inv.DueDate = normalizeDueDate(inv.DueDate)
	if err := h.service.Create(&inv); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusCreated, inv)
}

func (h *InvoiceHandler) Update(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	existing, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	var body entity.Invoice
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	existing.InvoiceNumber = body.InvoiceNumber
	existing.InvoiceDate = body.InvoiceDate
	existing.DueDate = normalizeDueDate(body.DueDate)
	existing.Status = body.Status
	existing.CustomerName = body.CustomerName
	existing.CustomerPhone = body.CustomerPhone
	existing.CustomerEmail = body.CustomerEmail
	existing.CustomerAddress = body.CustomerAddress
	existing.TaxPercent = body.TaxPercent
	existing.Notes = body.Notes
	existing.IncludeBbmNote = body.IncludeBbmNote
	existing.UseBbmColumns = body.UseBbmColumns
	existing.Location = body.Location
	existing.Subject = body.Subject
	existing.EquipmentName = body.EquipmentName
	existing.IntroParagraph = body.IntroParagraph
	existing.BankAccount = body.BankAccount
	existing.TerbilangCustom = body.TerbilangCustom
	existing.QuantityUnit = body.QuantityUnit
	existing.PriceUnitLabel = body.PriceUnitLabel
	existing.ItemColumnLabel = body.ItemColumnLabel
	existing.Items = body.Items
	if err := h.service.Update(existing); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	updated, _ := h.service.GetByID(uint(id))
	return response.Success(c, http.StatusOK, updated)
}

func (h *InvoiceHandler) Delete(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	if _, err := h.service.GetByID(uint(id)); err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	if err := h.service.Delete(uint(id)); err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusNoContent, nil)
}

func (h *InvoiceHandler) GetByID(c echo.Context) error {
	id, _ := strconv.Atoi(c.Param("id"))
	inv, err := h.service.GetByID(uint(id))
	if err != nil {
		return response.Error(c, http.StatusNotFound, err)
	}
	return response.Success(c, http.StatusOK, inv)
}

func (h *InvoiceHandler) GetAllWithPagination(c echo.Context) error {
	params := response.ParseQueryParams(c)
	list, total, err := h.service.GetAllWithPagination(params)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	pagination := response.CalculatePagination(params.Page, params.Limit, total)
	return response.SuccessWithPagination(c, http.StatusOK, list, pagination)
}

func (h *InvoiceHandler) GetCustomerSuggestions(c echo.Context) error {
	search := c.QueryParam("q")
	limit := 30
	if l := c.QueryParam("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 100 {
			limit = n
		}
	}
	list, err := h.service.GetCustomerSuggestions(search, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, err)
	}
	return response.Success(c, http.StatusOK, list)
}

// ExtractFromImage menerima upload satu atau banyak gambar (nota/timesheet). Banyak gambar = 1 gambar 1 hari, digabung.
// Form: image (atau image[]) untuk file; quantity_unit (hari|jam), use_bbm_columns (true|false), bbm_unit_price, location, equipment_name untuk config.
func (h *InvoiceHandler) ExtractFromImage(c echo.Context) error {
	form, err := c.MultipartForm()
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	files := form.File["image"]
	if len(files) == 0 {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "minimal 1 gambar (field 'image')"))
	}
	quantityUnit := strings.TrimSpace(c.FormValue("quantity_unit"))
	if quantityUnit == "" {
		quantityUnit = "hari"
	}
	useBBM := strings.ToLower(strings.TrimSpace(c.FormValue("use_bbm_columns"))) == "true"
	bbmUnitPriceStr := strings.TrimSpace(c.FormValue("bbm_unit_price"))
	bbmUnitPrice := 0.0
	if useBBM && bbmUnitPriceStr != "" {
		if p, err := strconv.ParseFloat(bbmUnitPriceStr, 64); err == nil {
			bbmUnitPrice = p
		}
	}
	location := strings.TrimSpace(c.FormValue("location"))
	equipmentName := strings.TrimSpace(c.FormValue("equipment_name"))

	type itemRow struct {
		ItemName     string  `json:"item_name"`
		Quantity     float64 `json:"quantity"`
		Days         float64 `json:"days"`
		Price        float64 `json:"price"`
		RowDate      string  `json:"row_date"`
		BbmQuantity  float64 `json:"bbm_quantity"`
		BbmUnitPrice float64 `json:"bbm_unit_price"`
	}
	type extractResp struct {
		CustomerName    string    `json:"customer_name"`
		CustomerPhone   string    `json:"customer_phone"`
		CustomerAddress string    `json:"customer_address"`
		InvoiceDate     string    `json:"invoice_date"`
		Location        string    `json:"location"`
		EquipmentName   string    `json:"equipment_name"`
		QuantityUnit    string    `json:"quantity_unit"`
		UseBbmColumns   bool      `json:"use_bbm_columns"`
		Notes           string    `json:"notes"`
		Items           []itemRow `json:"items"`
		Total           float64   `json:"total"`
	}
	resp := extractResp{
		Location:      location,
		EquipmentName: equipmentName,
		QuantityUnit:  quantityUnit,
		UseBbmColumns: useBBM,
	}

	// Satu gambar: mode lama (satu dokumen bisa banyak baris)
	if len(files) == 1 {
		file := files[0]
		imageData, mimeType, err := readImageFile(file)
		if err != nil {
			return response.Error(c, http.StatusBadRequest, err)
		}
		imageData, mimeType, err = imagepreprocess.RotatePortraitToLandscape(imageData, mimeType)
		if err != nil {
			return response.Error(c, http.StatusBadRequest, err)
		}
		var out *gemini.ExtractInvoiceResponse
			if strings.TrimSpace(strings.ToLower(h.cfg.ExtractProvider)) == "deepseek" {
				out, err = deepseek.ExtractInvoiceFromImage(h.cfg.DeepSeekBaseURL, h.cfg.DeepSeekAPIKey, h.cfg.DeepSeekModel, imageData, mimeType)
			} else {
				out, err = gemini.ExtractInvoiceFromImage(h.cfg.GeminiAPIKey, h.cfg.GeminiModel, imageData, mimeType)
			}
			if err != nil {
				return response.Error(c, http.StatusUnprocessableEntity, err)
			}
		resp.CustomerName = out.CustomerName
		resp.CustomerPhone = out.CustomerPhone
		resp.CustomerAddress = out.CustomerAddress
		resp.InvoiceDate = strings.TrimSpace(out.InvoiceDate)
		resp.Notes = out.Notes
		resp.Total = out.Total
		for _, it := range out.Items {
			resp.Items = append(resp.Items, itemRow{
				ItemName:     it.ItemName,
				Quantity:     it.Quantity,
				Days:         it.Days,
				Price:        it.Price,
				RowDate:      it.RowDate,
				BbmQuantity:  0,
				BbmUnitPrice: 0,
			})
		}
		if resp.Location == "" {
			resp.Location = location
		}
		return response.Success(c, http.StatusOK, resp)
	}

	// Banyak gambar: 1 gambar = 1 hari (1 baris)
	for i, file := range files {
		imageData, mimeType, err := readImageFile(file)
		if err != nil {
			return response.Error(c, http.StatusBadRequest, err)
		}
		imageData, mimeType, err = imagepreprocess.RotatePortraitToLandscape(imageData, mimeType)
		if err != nil {
			return response.Error(c, http.StatusBadRequest, err)
		}
		var one *gemini.ExtractOneDayResponse
			if strings.TrimSpace(strings.ToLower(h.cfg.ExtractProvider)) == "deepseek" {
				one, err = deepseek.ExtractOneDayFromImage(h.cfg.DeepSeekBaseURL, h.cfg.DeepSeekAPIKey, h.cfg.DeepSeekModel, imageData, mimeType, quantityUnit, useBBM)
			} else {
				one, err = gemini.ExtractOneDayFromImage(h.cfg.GeminiAPIKey, h.cfg.GeminiModel, imageData, mimeType, quantityUnit, useBBM)
			}
			if err != nil {
				return response.Error(c, http.StatusUnprocessableEntity, echo.NewHTTPError(http.StatusUnprocessableEntity, "gambar ke-"+(strconv.Itoa(i+1))+": "+err.Error()))
			}
		// Dari gambar pertama ambil customer & location jika belum dari config
		if i == 0 {
			if one.CustomerName != "" {
				resp.CustomerName = one.CustomerName
			}
			if one.CustomerAddress != "" {
				resp.CustomerAddress = one.CustomerAddress
			}
			if one.Location != "" && resp.Location == "" {
				resp.Location = one.Location
			}
			if one.Notes != "" {
				resp.Notes = one.Notes
			}
			if one.RowDate != "" {
				resp.InvoiceDate = one.RowDate
			}
		}
		bbmPrice := one.BbmUnitPrice
		if bbmPrice == 0 && useBBM && bbmUnitPrice > 0 {
			bbmPrice = bbmUnitPrice
		}
		resp.Items = append(resp.Items, itemRow{
			ItemName:     one.ItemName,
			Quantity:     one.Quantity,
			Days:         one.Days,
			Price:        one.Price,
			RowDate:      strings.TrimSpace(one.RowDate),
			BbmQuantity:  one.BbmQuantity,
			BbmUnitPrice: bbmPrice,
		})
		resp.Total += one.Days*one.Price + one.BbmQuantity*bbmPrice
	}
	return response.Success(c, http.StatusOK, resp)
}

func readImageFile(file *multipart.FileHeader) ([]byte, string, error) {
	src, err := file.Open()
	if err != nil {
		return nil, "", err
	}
	defer src.Close()
	data, err := io.ReadAll(src)
	if err != nil {
		return nil, "", err
	}
	if len(data) > 4*1024*1024 {
		return nil, "", echo.NewHTTPError(http.StatusBadRequest, "gambar terlalu besar (maks 4MB)")
	}
	mimeType := file.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "image/jpeg"
	}
	return data, mimeType, nil
}

// ExtractRowFromImage upload satu gambar untuk satu baris item: ekstrak hanya tanggal dan hari/jam. Harga diambil dari alat berat (bisa diedit di form).
func (h *InvoiceHandler) ExtractRowFromImage(c echo.Context) error {
	c.Logger().Info("extract-row-from-image: request received")
	file, err := c.FormFile("image")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	quantityUnit := strings.TrimSpace(c.FormValue("quantity_unit"))
	if quantityUnit == "" {
		quantityUnit = "hari"
	}
	imageData, mimeType, err := readImageFile(file)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	imageData, mimeType, err = imagepreprocess.RotatePortraitToLandscape(imageData, mimeType)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	var out *gemini.ExtractRowResponse
	if strings.TrimSpace(strings.ToLower(h.cfg.ExtractProvider)) == "deepseek" {
		out, err = deepseek.ExtractDateAndDaysFromImage(h.cfg.DeepSeekBaseURL, h.cfg.DeepSeekAPIKey, h.cfg.DeepSeekModel, imageData, mimeType)
	} else {
		out, err = gemini.ExtractDateAndDaysFromImage(h.cfg.GeminiAPIKey, h.cfg.GeminiModel, imageData, mimeType)
	}
	if err != nil {
		c.Logger().Errorf("extract-row-from-image: ekstraksi gagal: %v", err)
		return response.Error(c, http.StatusUnprocessableEntity, err)
	}
	// Konversi ke satuan form: form "hari" + ekstrak "jam" -> 8 jam = 1 hari, 4 jam = 0.5 hari; form "jam" + ekstrak "hari" -> 1 hari = 8 jam
	days := out.Quantity
	extractedUnit := strings.ToLower(strings.TrimSpace(out.Unit))
	if quantityUnit == "hari" && extractedUnit == "jam" {
		days = out.Quantity / 8
	} else if quantityUnit == "jam" && extractedUnit == "hari" {
		days = out.Quantity * 8
	}
	return response.Success(c, http.StatusOK, map[string]interface{}{
		"row_date": strings.TrimSpace(out.RowDate),
		"days":     days,
	})
}

// --- Parse timesheet dari teks OCR (Ollama /api/generate) ---

// TimesheetJamKerja satu baris jam kerja.
type TimesheetJamKerja struct {
	Awal  *string  `json:"awal"`
	Akhir *string  `json:"akhir"`
	Jam   *float64 `json:"jam"`
}

// TimesheetRawOCR untuk audit (teks OCR mentah).
type TimesheetRawOCR struct {
	Text string `json:"text"`
}

// TimesheetParsedResponse schema output parser timesheet (strict JSON, ada raw_ocr untuk audit).
type TimesheetParsedResponse struct {
	No           *string             `json:"no"`
	DipakaiOleh  *string             `json:"dipakai_oleh"`
	BP           *string             `json:"bp"`
	Excavator    *string             `json:"excavator"`
	Lokasi       *string             `json:"lokasi"`
	Hari         *string             `json:"hari"`
	Tanggal      *string             `json:"tanggal"`
	JamKerja     []TimesheetJamKerja `json:"jam_kerja"`
	TotalJam     *float64            `json:"total_jam"`
	Keterangan   *string             `json:"keterangan"`
	TtdOperator  *bool               `json:"ttd_operator"`
	TtdPemakai   *bool               `json:"ttd_pemakai"`
	RawOCR       *TimesheetRawOCR    `json:"raw_ocr"`
}

// parseTimesheetPrompt strict: OCR → JSON, normalisasi tanggal/jam, raw_ocr.text = OCR_TEXT.
func parseTimesheetPrompt(ocrText string) string {
	return `Kamu adalah parser dokumen timesheet tulisan tangan.
Output HARUS berupa JSON valid saja, tanpa teks tambahan, tanpa markdown.

Aturan:
- Jangan mengarang. Jika field tidak terbaca, isi null.
- Normalisasi jam: "8.00" / "8:0" / "08.00" => "08:00".
- Normalisasi tanggal: jika format dd.mm.yy (mis 04.02.26) => "2026-02-04"; jika dd/mm/yy => "2026-02-04".
- Hari boleh string apa adanya (mis "AHAD", "SENIN"), jika ragu null.
- total_jam = jumlah semua jam_kerja[].jam jika bisa dihitung, jika tidak null.
- jam_kerja boleh 0..N item. Jika hanya ada total tanpa detail, jam_kerja bisa [] dan total_jam diisi jika terbaca.
- Keterangan tulis apa adanya (string).
- Jangan masukkan tanda tangan sebagai teks; cukup boolean "ttd_operator" dan "ttd_pemakai" bila terlihat ada tanda tangan.

Schema JSON:
{
  "no": string|null,
  "dipakai_oleh": string|null,
  "bp": string|null,
  "excavator": string|null,
  "lokasi": string|null,
  "hari": string|null,
  "tanggal": string|null,
  "jam_kerja": [{"awal": string|null, "akhir": string|null, "jam": number|null}],
  "total_jam": number|null,
  "keterangan": string|null,
  "ttd_operator": boolean|null,
  "ttd_pemakai": boolean|null,
  "raw_ocr": { "text": string }
}

Input OCR mentah:
` + ocrText + `

Tambahkan raw_ocr.text = Input OCR mentah di atas (apa adanya).
Keluarkan JSON sesuai schema.`
}

// parseTimesheetRepairPrompt untuk retry saat validasi gagal.
func parseTimesheetRepairPrompt(badJSON string) string {
	return `JSON berikut dari parser timesheet tidak valid atau tidak sesuai schema.
Perbaiki agar menjadi JSON valid sesuai schema timesheet (no, dipakai_oleh, bp, excavator, lokasi, hari, tanggal, jam_kerja[], total_jam, keterangan, ttd_operator, ttd_pemakai, raw_ocr.text).
Normalisasi jam ke "08:00", tanggal ke "YYYY-MM-DD". Jangan mengarang.
Keluarkan HANYA JSON yang diperbaiki, tanpa teks lain.

JSON yang perlu diperbaiki:
` + badJSON
}

// cleanTimesheetJSON strip markdown dan trailing comma dari respons model.
func cleanTimesheetJSON(s string) string {
	s = strings.TrimSpace(s)
	if len(s) >= 7 && strings.HasPrefix(s, "```json") {
		s = strings.TrimSpace(s[7:])
	} else if len(s) >= 3 && strings.HasPrefix(s, "```") {
		s = strings.TrimSpace(s[3:])
	}
	if idx := strings.Index(s, "{"); idx >= 0 {
		s = s[idx:]
	}
	if idx := strings.LastIndex(s, "}"); idx >= 0 {
		s = s[:idx+1]
	}
	// Hapus trailing comma sebelum }
	if idx := strings.LastIndex(s, "}"); idx >= 0 {
		body := strings.TrimRight(strings.TrimSpace(s[:idx]), ",\n\r\t ")
		s = body + "}"
	}
	return s
}

func isOllamaBaseURL(baseURL string) bool {
	u := strings.ToLower(baseURL)
	return strings.Contains(u, "11434") || strings.Contains(u, "ollama")
}

// validateTimesheetJSON memastikan hasil parse bisa di-unmarshal dan punya struktur wajar. Return nil jika ok.
func validateTimesheetJSON(raw string) error {
	var out TimesheetParsedResponse
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return err
	}
	return nil
}

// parseTimesheetWithRetry panggil Ollama dengan prompt, bersihkan JSON, validasi; jika gagal sekali retry dengan repair prompt.
func (h *InvoiceHandler) parseTimesheetWithRetry(baseURL, model, ocrText string) (TimesheetParsedResponse, error) {
	prompt := parseTimesheetPrompt(ocrText)
	raw, err := deepseek.CallOllamaGenerate(baseURL, model, prompt, true)
	if err != nil {
		return TimesheetParsedResponse{}, err
	}
	raw = cleanTimesheetJSON(raw)
	if err := validateTimesheetJSON(raw); err != nil {
		// Retry sekali dengan repair prompt
		repairPrompt := parseTimesheetRepairPrompt(raw)
		raw, err = deepseek.CallOllamaGenerate(baseURL, model, repairPrompt, true)
		if err != nil {
			return TimesheetParsedResponse{}, err
		}
		raw = cleanTimesheetJSON(raw)
	}
	var out TimesheetParsedResponse
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return TimesheetParsedResponse{}, fmt.Errorf("parse json: %w", err)
	}
	// Audit: pastikan raw_ocr.text terisi
	if out.RawOCR == nil {
		out.RawOCR = &TimesheetRawOCR{Text: ocrText}
	} else if out.RawOCR.Text == "" {
		out.RawOCR.Text = ocrText
	}
	return out, nil
}

// ParseTimesheetText menerima teks OCR, memanggil Ollama /api/generate, mengembalikan JSON timesheet.
// Body: { "text": "..." } atau { "ocr_text": "..." }. Memakai DEEPSEEK_BASE_URL + DEEPSEEK_MODEL (Ollama).
func (h *InvoiceHandler) ParseTimesheetText(c echo.Context) error {
	var body struct {
		Text    string `json:"text"`
		OcrText string `json:"ocr_text"`
	}
	if err := c.Bind(&body); err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	ocrText := strings.TrimSpace(body.Text)
	if ocrText == "" {
		ocrText = strings.TrimSpace(body.OcrText)
	}
	if ocrText == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "text atau ocr_text wajib"))
	}

	baseURL := strings.TrimSuffix(h.cfg.DeepSeekBaseURL, "/")
	if baseURL == "" {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "DEEPSEEK_BASE_URL belum di-set (untuk Ollama)"))
	}
	if !isOllamaBaseURL(baseURL) {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "parse-timesheet hanya mendukung Ollama (DEEPSEEK_BASE_URL seperti http://localhost:11434)"))
	}
	model := h.cfg.DeepSeekModel
	if model == "" {
		model = "qwen2.5:7b"
	}

	out, err := h.parseTimesheetWithRetry(baseURL, model, ocrText)
	if err != nil {
		return response.Error(c, http.StatusUnprocessableEntity, err)
	}
	return response.Success(c, http.StatusOK, out)
}

// ParseTimesheetFromImage pipeline: preprocess (resize max 1024) → OCR → LLM (Ollama text) → validasi + retry repair.
// Hindari vision model; pakai OCR→LLM agar stabil untuk tulisan tangan.
func (h *InvoiceHandler) ParseTimesheetFromImage(c echo.Context) error {
	file, err := c.FormFile("image")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	imageData, mimeType, err := readImageFile(file)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	imageData, mimeType, err = imagepreprocess.RotatePortraitToLandscape(imageData, mimeType)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err)
	}
	// 1) Preprocess: resize sisi terpanjang max 1024px
	preprocessed, outMime, err := imagepreprocess.ResizeMaxLongEdge(imageData, mimeType)
	if err != nil {
		return response.Error(c, http.StatusUnprocessableEntity, fmt.Errorf("preprocess: %w", err))
	}
	// 2) OCR
	ocrRunner, err := ocr.ResolveRunner(h.cfg.TesseractPath, h.cfg.OCRScriptPath)
	if err != nil || ocrRunner == nil {
		return response.Error(c, http.StatusServiceUnavailable, echo.NewHTTPError(http.StatusServiceUnavailable, "OCR tidak dikonfigurasi. Set TESSERACT_PATH (atau OCR_SCRIPT_PATH) di config."))
	}
	ocrText, err := ocrRunner.Run(preprocessed, outMime)
	if err != nil {
		return response.Error(c, http.StatusUnprocessableEntity, fmt.Errorf("ocr: %w", err))
	}
	if strings.TrimSpace(ocrText) == "" {
		return response.Error(c, http.StatusUnprocessableEntity, echo.NewHTTPError(http.StatusUnprocessableEntity, "OCR tidak menghasilkan teks. Coba gambar lebih jelas atau periksa Tesseract."))
	}
	// 3) Ollama (text-only) + validasi + retry repair
	baseURL := strings.TrimSuffix(h.cfg.DeepSeekBaseURL, "/")
	if baseURL == "" || !isOllamaBaseURL(baseURL) {
		return response.Error(c, http.StatusBadRequest, echo.NewHTTPError(http.StatusBadRequest, "parse-timesheet-from-image membutuhkan Ollama (DEEPSEEK_BASE_URL seperti http://localhost:11434)"))
	}
	model := h.cfg.DeepSeekModel
	if model == "" {
		model = "qwen2.5:7b"
	}
	out, err := h.parseTimesheetWithRetry(baseURL, model, ocrText)
	if err != nil {
		return response.Error(c, http.StatusUnprocessableEntity, err)
	}
	return response.Success(c, http.StatusOK, out)
}
