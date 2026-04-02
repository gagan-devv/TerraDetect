package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gagan-devv/terradetect/backend/config"
	"github.com/gagan-devv/terradetect/backend/db"
	"github.com/gagan-devv/terradetect/backend/handlers"
	"github.com/gagan-devv/terradetect/backend/inference"
	"github.com/gagan-devv/terradetect/backend/middleware"
)

func main() {
	cfg := config.Load()

	database, err := db.Connect(cfg.MongoURI, cfg.DBName)
	if err != nil {
		log.Fatalf("MongoDB connection failed: %v", err)
	}
	log.Println("Connected to MongoDB")

	onnx, err := inference.LoadModels(cfg.CropModelPath, cfg.FertilizerModelPath)
	if err != nil {
		log.Fatalf("ONNX model load failed: %v", err)
	}
	log.Println("ONNX models loaded")

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type", "x-api-key"},
		AllowCredentials: false,
	}))

	// ── Handlers ─────────────────────────────────────────────────────────────
	authH    := handlers.NewAuthHandler(database, cfg)
	sensorH  := handlers.NewSensorHandler(database)
	deviceH  := handlers.NewDeviceHandler(database)
	predictH := handlers.NewPredictHandler(database, onnx)
	weatherH := handlers.NewWeatherHandler(cfg)

	// ── Legacy ESP32 endpoint (no /api/v1 prefix — avoid reflashing devices) ─
	r.POST("/api/esp32",
		middleware.NewLimiter("2-S"),
		sensorH.ReceiveESP32,
	)

	// ── Public routes ─────────────────────────────────────────────────────────
	r.POST("/api/v1/auth/register",  middleware.NewLimiter("3-M"), authH.Register)
	r.POST("/api/v1/auth/login",     middleware.NewLimiter("5-M"), authH.Login)
	r.POST("/api/v1/auth/refresh",   authH.Refresh)
	r.POST("/api/v1/auth/guest",     middleware.NewLimiter("10-M"), authH.GuestToken)
	r.POST("/api/v1/device/check",   deviceH.Check)

	// ── Guest prediction endpoints (no auth required) ─────────────────────────
	r.POST("/api/v1/guest/predict/crop",        middleware.NewLimiter("10-M"), predictH.GuestCrop)
	r.POST("/api/v1/guest/predict/suitability", middleware.NewLimiter("10-M"), predictH.GuestSuitability)
	r.POST("/api/v1/guest/predict/fertilizer",  middleware.NewLimiter("10-M"), predictH.GuestFertilizer)

	// ── Protected routes ──────────────────────────────────────────────────────
	protected := r.Group("/api/v1")
	protected.Use(middleware.Auth(cfg.SecretKey))
	{
		protected.POST("/auth/logout", authH.Logout)

		// User-only routes (guest tokens blocked)
		protected.GET("/sensor/latest",  middleware.RequireUser(), sensorH.Latest)
		protected.GET("/sensor/history", middleware.RequireUser(), sensorH.History)
		protected.GET("/weather",        middleware.RequireUser(), weatherH.Get)

		// Prediction routes (guest tokens allowed)
		protected.POST("/predict/crop",        predictH.Crop)
		protected.POST("/predict/suitability", predictH.Suitability)
		protected.POST("/predict/fertilizer",  predictH.Fertilizer)
	}

	log.Printf("TerraDetect backend listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}