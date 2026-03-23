package handlers

import (
	"context"
	"crypto/sha256"
	"fmt"
	"net/http"
	"time"

	"github.com/gagan-devv/terradetect/backend/config"
	"github.com/gagan-devv/terradetect/backend/db"
	"github.com/gagan-devv/terradetect/backend/models"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db  *db.Database
	cfg *config.Config
}

func NewAuthHandler(database *db.Database, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		db:  database,
		cfg: cfg,
	}
}

type registerRequest struct {
	Username string `json:"username" binding:"required,min=3,max=32"`
	Password string `json:"password" binding:"required,min=8"`
	DeviceID string `json:"device_id" binding:"required,len=6"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var device models.Device
	err := h.db.Devices.FindOne(ctx, bson.M{
		"device_id":  req.DeviceID,
		"registered": false,
	}).Decode(&device)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "DEVICE_NOT_REGISTERED",
				"message": "Invalid or already registered device ID.",
			},
		})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to hash password.",
			},
		})
		return
	}

	_, err = h.db.Users.InsertOne(ctx, bson.M{
		"username":      req.Username,
		"password_hash": string(hash),
		"device_id":     req.DeviceID,
		"created_at":    primitive.NewDateTimeFromTime(time.Now()),
	})

	if err != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Username already taken.",
			},
		})
		return
	}

	_, _ = h.db.Devices.UpdateOne(ctx,
		bson.M{"device_id": req.DeviceID},
		bson.M{"$set": bson.M{"registered": true}},
	)

	c.JSON(http.StatusCreated, gin.H{
		"username":  req.Username,
		"device_id": req.DeviceID,
		"api_key":   device.APIKey,
	})
}

type loginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	DeviceID string `json:"device_id" binding:"required"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
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

	var user models.User

	err := h.db.Users.FindOne(ctx, bson.M{
		"username":  req.Username,
		"device_id": req.DeviceID,
	}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "INVALID_CREDENTIALS",
				"message": "Invalid username, password, or device ID.",
			},
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "INVALID_CREDENTIALS",
				"message": "Invalid username, password, or device ID.",
			},
		})
		return
	}

	accessToken, err := h.generateToken(user.Username, user.DeviceID, "access", 30*24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate token.",
			},
		})
		return
	}

	refreshToken, err := h.generateToken(user.Username, user.DeviceID, "refresh", 30*24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate token.",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"expires_in":    900,
		"token_type":    "Bearer",
		"user": gin.H{
			"username":  user.Username,
			"device_id": user.DeviceID,
		},
	})
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
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

	tokenHash := fmt.Sprintf("%x", sha256.Sum256([]byte(req.RefreshToken)))
	count, _ := h.db.TokenDenyList.CountDocuments(ctx, bson.M{"token_hash": tokenHash})

	if count > 0 {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Token has been revoked.",
			},
		})
		return
	}

	token, err := jwt.Parse(req.RefreshToken, func(t *jwt.Token) (any, error) {
		return []byte(h.cfg.SecretKey), nil
	})
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Invalid or expired refresh token.",
			},
		})
		return
	}

	claims := token.Claims.(jwt.MapClaims)
	if claims["token"] != "refresh" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": gin.H{
				"code":    "UNAUTHORIZED",
				"message": "Not a refresh token.",
			},
		})
		return
	}

	username := claims["username"].(string)
	deviceID := claims["device_id"].(string)

	accessToken, err := h.generateToken(username, deviceID, "access", 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to generate token.",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"expires_in":   900,
		"token_type":   "Bearer",
	})
}

type logoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req logoutRequest
	_ = c.ShouldBindJSON(&req)

	if req.RefreshToken != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Parse to get expiry for TTL
		token, err := jwt.Parse(req.RefreshToken,
			func(t *jwt.Token) (any, error) { return []byte(h.cfg.SecretKey), nil },
			jwt.WithValidMethods([]string{"HS256"}),
		)

		var expiresAt time.Time
		if err == nil && token.Valid {
			claims := token.Claims.(jwt.MapClaims)
			if exp, ok := claims["exp"].(float64); ok {
				expiresAt = time.Unix(int64(exp), 0)
			}
		} else {
			expiresAt = time.Now().Add(30 * 24 * time.Hour)
		}

		tokenHash := fmt.Sprintf("%x", sha256.Sum256([]byte(req.RefreshToken)))
		_, _ = h.db.TokenDenyList.InsertOne(ctx, bson.M{
			"token_hash": tokenHash,
			"expires_at": primitive.NewDateTimeFromTime(expiresAt),
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully."})
}

func (h *AuthHandler) generateToken(username, deviceID, tokenType string, duration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"username":   username,
		"device_id":  deviceID,
		"token_type": tokenType,
		"exp":        time.Now().Add(duration).Unix(),
		"iat":        time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(h.cfg.SecretKey))
}
