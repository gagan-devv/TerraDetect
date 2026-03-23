package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gagan-devv/terradetect/backend/db"
	"github.com/gagan-devv/terradetect/backend/models"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type DeviceHandler struct {
	db *db.Database
}

func NewDeviceHandler(database *db.Database) *DeviceHandler {
	return &DeviceHandler{
		db: database,
	}
}

type checkDeviceRequest struct {
	DeviceID string `json:"device_id" binding:"required"`
}

func (h *DeviceHandler) Check(c *gin.Context) {
	var req checkDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code": "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5 * time.Second)
	defer cancel()

	var device models.Device
	err := h.db.Devices.FindOne(ctx, bson.M{"device_id": req.DeviceID}).Decode(&device)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code": "NOT_FOUND",
				"message": "Device ID not found.",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"registered": device.Registered})
}