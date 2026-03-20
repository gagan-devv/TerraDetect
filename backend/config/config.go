package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoURI      string
	DBName        string
	SecretKey     string
	WeatherAPIKey string
	Port          string
}

func Load() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		MongoURI:      mustGet("MONGO_URI"),
		DBName:        getOrDefault("DB_NAME", "terradetect"),
		SecretKey:     mustGet("SECRET_KEY"),
		WeatherAPIKey: mustGet("WEATHER_API_KEY"),
		Port:          getOrDefault("PORT", "8080"),
	}

	return cfg
}

func mustGet(key string) string {
	v := os.Getenv(key)

	if v == "" {
		log.Fatalf("required env var %s is not set", key)
	}

	return v
}

func getOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}
