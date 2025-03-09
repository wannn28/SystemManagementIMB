package response

import (
	"github.com/labstack/echo/v4"
)

func Success(c echo.Context, code int, data interface{}) error {
	return c.JSON(code, map[string]interface{}{
		"status": code,
		"data":   data,
	})
}

func Error(c echo.Context, code int, err error) error {
	return c.JSON(code, map[string]interface{}{
		"status":  code,
		"message": err.Error(),
	})
}
