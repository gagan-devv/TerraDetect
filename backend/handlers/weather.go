package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/gagan-devv/terradetect/backend/config"
)

type WeatherHandler struct {
	cfg *config.Config
}

func NewWeatherHandler(cfg *config.Config) *WeatherHandler {
	return &WeatherHandler{cfg: cfg}
}

func (h *WeatherHandler) Get(c *gin.Context) {
	lat := c.Query("lat")
	lon := c.Query("lon")
	if lat == "" || lon == "" {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "lat and lon query params are required."},
		})
		return
	}

	url := fmt.Sprintf(
		"https://api.weatherapi.com/v1/current.json?key=%s&q=%s,%s&aqi=no",
		h.cfg.WeatherAPIKey, lat, lon,
	)

	resp, err := http.Get(url)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to reach weather API."},
		})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var raw struct {
		Location struct {
			Name   string `json:"name"`
			Region string `json:"region"`
		} `json:"location"`
		Current struct {
			TempC     float64 `json:"temp_c"`
			Humidity  float64 `json:"humidity"`
			PrecipMM  float64 `json:"precip_mm"`
			Condition struct {
				Text string `json:"text"`
			} `json:"condition"`
		} `json:"current"`
	}

	if err := json.Unmarshal(body, &raw); err != nil || resp.StatusCode != 200 {
		c.JSON(http.StatusBadGateway, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Invalid response from weather API."},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"temperature": raw.Current.TempC,
		"humidity":    raw.Current.Humidity,
		"rainfall_mm": raw.Current.PrecipMM,
		"condition":   raw.Current.Condition.Text,
		"location":    raw.Location.Name + ", " + raw.Location.Region,
	})
}
