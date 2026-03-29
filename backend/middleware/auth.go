package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func Auth(secretKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Missing or invalid Authorization header.",
				},
			})
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		token, err := jwt.Parse(tokenStr,
			func(t *jwt.Token) (any, error) {
				return []byte(secretKey), nil
			},
			jwt.WithValidMethods([]string{"HS256"}),
		)

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{
					"code":    "UNAUTHORIZED",
					"message": "Invalid or expired token.",
				},
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Invalid token claims."},
			})
			return
		}

		// Reject refresh tokens used as access tokens
		if claims["token_type"] == "refresh" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Use access token, not refresh token."},
			})
			return
		}

		c.Set("username", claims["username"])
		c.Set("device_id", claims["device_id"])
		c.Next()
	}
}
