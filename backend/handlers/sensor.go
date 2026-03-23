package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gagan-devv/terradetect/backend/db"
	"github.com/gagan-devv/terradetect/backend/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SensorHandler struct {
	db *db.Database
}

func NewSensorHandler(database *db.Database) *SensorHandler {
	return &SensorHandler{
		db: database,
	}
}

type esp32Payload struct {
	DeviceId    string  `json:"device_id" binding:"required"`
	Temperature float64 `json:"temperature" binding:"required"`
	PH          float64 `json:"ph" binding:"required"`
	Humidity    float64 `json:"humidity" binding:"required"`
	EC          float64 `json:"ec" binding:"required"`
	N           float64 `json:"N" binding:"required"`
	P           float64 `json:"P" binding:"required"`
	K           float64 `json:"K" binding:"required"`
	Moisture    float64 `json:"moisture" binding:"required"`
}

func (h *SensorHandler) ReceiveESP32(c *gin.Context) {
	apiKey := c.GetHeader("x-api-key")
	if apiKey == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "INVALID_API_KEY",
				"message": "Missing x-api-key header.",
			},
		})
		return
	}

	var payload esp32Payload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var device models.Device
	err := h.db.Devices.FindOne(ctx, bson.M{"device_id": payload.DeviceId}).Decode(&device)
	if err != nil || device.APIKey != apiKey {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "INVALID_API_KEY",
				"message": "Unauthorized: invalid API key for device.",
			},
		})
		return
	}

	reading := bson.M{
		"device_id":   payload.DeviceId,
		"temperature": payload.Temperature,
		"ph":          payload.PH,
		"humidity":    payload.Humidity,
		"ec":          payload.EC,
		"n":           payload.N,
		"p":           payload.P,
		"k":           payload.K,
		"moisture":    payload.Moisture,
		"timestamp":   primitive.NewDateTimeFromTime(time.Now()),
	}

	_, err = h.db.SensorData.InsertOne(ctx, reading)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code": "INTERNAL_ERROR",
				"message": "Failed to store sensor data.",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "Sensor data received.",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *SensorHandler) Latest(c *gin.Context) {
	deviceID, _ := c.Get("device_id")

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	var reading models.SensorReading
	err := h.db.SensorData.FindOne(ctx,
		bson.M{"device_id": deviceID},
		options.FindOne().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	).Decode(&reading)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "No sensor data available for your device.",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"temperature": reading.Temperature,
			"ph":          reading.PH,
			"humidity":    reading.Humidity,
			"ec":          reading.EC,
			"n":           reading.N,
			"p":           reading.P,
			"k":           reading.K,
			"moisture":    reading.Moisture,
		},
		"timestamp": reading.Timestamp.Time().UTC().Format(time.RFC3339),
		"source":    "ESP32",
	})
}


func (h *SensorHandler) History(c *gin.Context) {
	deviceID, _ := c.Get("device_id")
 
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}
 
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
 
	filter := bson.M{"device_id": deviceID}
	total, err := h.db.SensorData.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to count records."},
		})
		return
	}
 
	skip := int64((page - 1) * perPage)
	cursor, err := h.db.SensorData.Find(ctx, filter,
		options.Find().
			SetSort(bson.D{{Key: "timestamp", Value: -1}}).
			SetSkip(skip).
			SetLimit(int64(perPage)),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to fetch history."},
		})
		return
	}
	defer cursor.Close(ctx)
 
	var readings []models.SensorReading
	if err := cursor.All(ctx, &readings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to decode records."},
		})
		return
	}
 
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}
 
	c.JSON(http.StatusOK, gin.H{
		"history": readings,
		"pagination": gin.H{
			"total":       total,
			"page":        page,
			"per_page":    perPage,
			"total_pages": totalPages,
		},
	})
}