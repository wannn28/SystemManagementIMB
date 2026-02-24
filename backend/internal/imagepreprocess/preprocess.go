// Package imagepreprocess melakukan resize/rotate untuk dokumen sebelum OCR.
// Tujuan: stabil, cepat — sisi terpanjang maks 1024px.
package imagepreprocess

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"

	"golang.org/x/image/draw"
)

const maxLongEdge = 1024

// ResizeMaxLongEdge mengubah ukuran gambar sehingga sisi terpanjang = maxLongEdge (1024px).
// Format output: JPEG (lebih kecil). Jika input PNG dengan alpha, konversi ke JPEG (background putih).
func ResizeMaxLongEdge(data []byte, mimeType string) ([]byte, string, error) {
	img, fmtName, err := decodeImage(data, mimeType)
	if err != nil {
		return nil, "", err
	}
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	if w <= 0 || h <= 0 {
		return nil, "", fmt.Errorf("invalid image size %dx%d", w, h)
	}
	long := w
	if h > long {
		long = h
	}
	if long <= maxLongEdge {
		// Tidak perlu resize, kembalikan as-is (atau re-encode ringan)
		return reencode(img, data, mimeType, fmtName)
	}
	// Scale down: ratio = 1024 / long
	ratio := float64(maxLongEdge) / float64(long)
	newW := int(float64(w) * ratio)
	newH := int(float64(h) * ratio)
	if newW < 1 {
		newW = 1
	}
	if newH < 1 {
		newH = 1
	}
	dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
	draw.ApproxBiLinear.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)
	return reencode(dst, nil, "image/jpeg", "jpeg")
}

func decodeImage(data []byte, mimeType string) (image.Image, string, error) {
	r := bytes.NewReader(data)
	switch {
	case mimeType == "image/png" || bytes.HasPrefix(data, []byte{0x89, 0x50, 0x4E, 0x47}):
		img, err := png.Decode(r)
		return img, "png", err
	case mimeType == "image/jpeg" || mimeType == "image/jpg" || bytes.HasPrefix(data, []byte{0xFF, 0xD8}):
		img, err := jpeg.Decode(r)
		return img, "jpeg", err
	default:
		img, fmtName, err := image.Decode(r)
		return img, fmtName, err
	}
}

func reencode(img image.Image, _ []byte, mimeType, fmtName string) ([]byte, string, error) {
	var buf bytes.Buffer
	outMime := "image/jpeg"
	if fmtName == "png" {
		outMime = "image/png"
		if err := png.Encode(&buf, img); err != nil {
			return nil, "", err
		}
		return buf.Bytes(), outMime, nil
	}
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 88}); err != nil {
		return nil, "", err
	}
	return buf.Bytes(), outMime, nil
}

// DecodeAndResizeFromReader membaca dari io.Reader, decode, resize max 1024, return JPEG bytes.
func DecodeAndResizeFromReader(r io.Reader, mimeType string) ([]byte, string, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, "", err
	}
	return ResizeMaxLongEdge(data, mimeType)
}

// RotatePortraitToLandscape jika gambar portrait (tinggi > lebar), putar 90° searah jarum jam jadi landscape.
// Model vision (Gemini/Qwen) lebih akurat baca dokumen landscape. Return JPEG bytes.
func RotatePortraitToLandscape(data []byte, mimeType string) ([]byte, string, error) {
	img, _, err := decodeImage(data, mimeType)
	if err != nil {
		return nil, "", err
	}
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	if w <= 0 || h <= 0 {
		return nil, "", fmt.Errorf("invalid image size %dx%d", w, h)
	}
	if w >= h {
		return data, mimeType, nil
	}
	// Portrait: rotate 90° clockwise. New size: width=h, height=w.
	dst := image.NewRGBA(image.Rect(0, 0, h, w))
	for y := 0; y < w; y++ {
		for x := 0; x < h; x++ {
			dst.Set(x, y, img.At(w-1-y, x))
		}
	}
	return reencode(dst, nil, "image/jpeg", "jpeg")
}
