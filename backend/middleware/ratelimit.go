package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
	ginlimiter "github.com/ulule/limiter/v3/drivers/middleware/gin"
)

func NewLimiter (rateStr string) gin.HandlerFunc {
	rate, err := limiter.NewRateFromFormatted(rateStr)
	if err != nil {
		panic("invalid rate format: " + rateStr)
	}
	store := memory.NewStore()
	instance := limiter.New(store, rate)
	return ginlimiter.NewMiddleware(instance)
}