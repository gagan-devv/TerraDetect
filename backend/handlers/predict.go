package handlers

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/gagan-devv/terradetect/backend/db"
	"github.com/gagan-devv/terradetect/backend/inference"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PredictHandler struct {
	db   *db.Database
	onnx *inference.Models
}

func NewPredictHandler(database *db.Database, onnx *inference.Models) *PredictHandler {
	return &PredictHandler{
		db:   database,
		onnx: onnx,
	}
}

type predictRequest struct {
	Source   string  `json:"source"`
	N        float64 `json:"N"`
	P        float64 `json:"P"`
	K        float64 `json:"K"`
	Temp     float64 `json:"temperature"`
	Humidity float64 `json:"humidity"`
	PH       float64 `json:"ph"`
	Rainfall float64 `json:"rainfall"`
	Moisture float64 `json:"moisture"`
	SoilType string  `json:"soil_type"`
	CropName string  `json:"crop_name"`
}

func (h *PredictHandler) resolveFeatures(c *gin.Context, req *predictRequest) bool {
	if req.Source != "sensor" {
		return true
	}

	deviceID, _ := c.Get("device_id")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var doc struct {
		Temperature float64            `bson:"temperature"`
		Humidity    float64            `bson:"humidity"`
		PH          float64            `bson:"ph"`
		N           float64            `bson:"N"`
		P           float64            `bson:"P"`
		K           float64            `bson:"K"`
		Rainfall    float64            `bson:"rainfall"`
		Timestamp   primitive.DateTime `bson:"timestamp"`
	}
	err := h.db.SensorData.FindOne(ctx,
		bson.M{"device_id": deviceID},
		options.FindOne().SetSort(bson.D{{Key: "timestamp", Value: -1}}),
	).Decode(&doc)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "No sensor data for your device.",
			},
		})
		return false
	}
	req.N = doc.N
	req.P = doc.P
	req.K = doc.K
	req.Temp = doc.Temperature
	req.Humidity = doc.Humidity
	req.PH = doc.PH
	req.Rainfall = doc.Rainfall
	return true
}

func (h *PredictHandler) Crop(c *gin.Context) {
	var req predictRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	if !h.resolveFeatures(c, &req) {
		return
	}

	features := []float32{
		float32(req.N), float32(req.P), float32(req.K),
		float32(req.Temp), float32(req.Humidity), float32(req.PH),
		float32(req.Rainfall),
	}

	crop, confidence, err := h.onnx.PredictCrop(features)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Crop mdoel inference failed.",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"recommended_crop": crop,
		"confidence":       math.Round(confidence*100) / 100,
	})
}

var idealValues = map[string][7]float64{
	"rice":        {80, 40, 40, 23, 82, 6.5, 236},
	"maize":       {78, 48, 20, 22, 65, 6.0, 60},
	"chickpea":    {40, 67, 79, 18, 16, 7.2, 80},
	"kidneybeans": {20, 67, 20, 19, 21, 5.7, 105},
	"pigeonpeas":  {20, 67, 20, 27, 48, 5.8, 149},
	"mothbeans":   {21, 48, 20, 28, 53, 6.9, 53},
	"mungbean":    {20, 47, 20, 28, 85, 6.7, 48},
	"blackgram":   {40, 67, 19, 30, 65, 7.0, 67},
	"lentil":      {18, 68, 19, 24, 64, 6.9, 45},
	"pomegranate": {18, 18, 40, 21, 90, 6.2, 107},
	"banana":      {100, 82, 50, 27, 80, 5.9, 105},
	"mango":       {20, 27, 30, 31, 50, 5.7, 95},
	"grapes":      {23, 132, 200, 24, 81, 6.0, 70},
	"watermelon":  {99, 59, 50, 25, 85, 6.5, 50},
	"muskmelon":   {100, 17, 50, 28, 92, 6.3, 25},
	"apple":       {21, 134, 199, 22, 92, 5.9, 112},
	"orange":      {20, 10, 10, 22, 92, 7.0, 110},
	"papaya":      {50, 59, 50, 33, 92, 6.7, 143},
	"coconut":     {21, 5, 30, 27, 94, 5.9, 142},
	"cotton":      {118, 46, 20, 25, 79, 6.9, 80},
	"jute":        {78, 46, 40, 24, 79, 6.7, 174},
	"coffee":      {101, 28, 29, 25, 58, 6.8, 158},
	"wheat":       {60, 30, 50, 20, 82, 6.5, 75},
}

var paramNames = [7]string{
	"Nitrogen (N)", "Phosphorus (P)", "Potassium (K)",
	"Temperature", "Humidity", "pH", "Rainfall",
}

type tableRow struct {
	Parameter   string  `json:"parameter"`
	Recommended float64 `json:"recommended"`
	Observed    float64 `json:"observed"`
	Status      string  `json:"status"`
	Remarks     string  `json:"remarks"`
}

func (h *PredictHandler) Suitability(c *gin.Context) {
	var req predictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	if req.CropName == "" {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "crop_name is required.",
			},
		})
		return
	}

	cropKey := strings.ToLower(strings.ReplaceAll(req.CropName, " ", ""))
	ideal, ok := idealValues[cropKey]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Crop not found in dataset.",
			},
		})
		return
	}

	observed := [7]float64{
		req.N, req.P, req.K,
		req.Temp, req.Humidity, req.PH, req.Rainfall,
	}

	var totalDeviation float64
	for i := 0; i < 7; i++ {
		maxDev := ideal[i] * 0.2
		if maxDev == 0 {
			maxDev = 1
		}
		totalDeviation += math.Abs(observed[i]-ideal[i]) / maxDev
	}
	score := math.Abs(100 - (totalDeviation * 100 / 7))
	score = math.Mod(score, 100)
	score = math.Round(score*100) / 100

	fertAdvice := map[string]string{
		"Nitrogen (N)":   "Apply nitrogen-rich fertilizers like urea or ammonium sulfate.",
		"Phosphorus (P)": "Use phosphorus fertilizers such as bone meal or superphosphate.",
		"Potassium (K)":  "Add potassium-based fertilizers like potash or wood ash.",
		"Temperature":    "Use greenhouse techniques or choose planting times strategically.",
		"Humidity":       "Implement irrigation systems or use mulching techniques.",
		"pH":             "Add lime to increase pH or sulfur to decrease pH.",
		"Rainfall":       "Use drip irrigation or rainwater harvesting techniques.",
	}

	var table []tableRow
	var recommendations []string

	for i := 0; i < 7; i++ {
		row := tableRow{
			Parameter:   paramNames[i],
			Recommended: math.Round(ideal[i]*100) / 100,
			Observed:    math.Round(observed[i]*100) / 100,

			Status:  "optimal",
			Remarks: "Optimial",
		}
		low := ideal[i] * 0.8
		high := ideal[i] * 1.2

		switch {
		case observed[i] < low:
			shortage := math.Round((ideal[i] - observed[i]) * 100 / 100)
			row.Status = "low"
			row.Remarks = fmt.Sprintf("%s is too low. Increase by %.2f. %s", paramNames[i], shortage, fertAdvice[paramNames[i]])
			recommendations = append(recommendations, fmt.Sprintf("%s is too low. Increase by %.2f.", paramNames[i], shortage))

		case observed[i] > high:
			excess := math.Round((observed[i] - ideal[i]) * 100 / 100)
			row.Status = "high"
			if paramNames[i] == "Humidity" || paramNames[i] == "Rainfall" {
				row.Remarks = "Too high."
			} else {
				row.Remarks = fmt.Sprintf("Too high. Decrement by %.2f. Consider soil amendments.", excess)
				recommendations = append(recommendations, fmt.Sprintf("%s is too high. Decrease by %.2f.", paramNames[i], excess))
			}
		}

		table = append(table, row)
	}

	c.JSON(http.StatusOK, gin.H{
		"crop":              req.CropName,
		"suitability_score": score,
		"table":             table,
		"recommendations":   recommendations,
	})
}

func (h *PredictHandler) Fertilizer(c *gin.Context) {
	var req predictRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}
	if !h.resolveFeatures(c, &req) {
		return
	}

	soilType := req.SoilType
	if soilType == "" {
		soilType = "Black"
	}
	cropName := req.CropName
	if cropName == "" {
		cropName = "Wheat"
	}

	features := []float32{
		float32(req.Temp), float32(req.Humidity), float32(req.Moisture),
		float32(encodeSoil(soilType)), float32(encodeCrop(cropName)),
		float32(req.N), float32(req.K), float32(req.P),
	}

	fertilizer, err := h.onnx.PredictFertilizer(features)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Fertilizer model inference failed."},
		})
		return
	}

	defN := math.Max(0, 50-req.N)
	defP := math.Max(0, 40-req.P)
	defK := math.Max(0, 40-req.K)

	resp := gin.H{
		"fertilizer":   fertilizer,
		"composition":  fertilizerComposition(fertilizer),
		"deficiencies": gin.H{"N": defN, "P": defP, "K": defK},
		"rationale":    "Recommended based on soil and crop requirements.",
		"application":  applicationAdvice(fertilizer, cropName),
	}
	if defN > 0 {
		resp["nitrogen_advice"] = fmt.Sprintf("Add %.1f kg/ha of nitrogen using Urea or similar.", defN)
	}
	if defP > 0 {
		resp["phosphorus_advice"] = fmt.Sprintf("Add %.1f kg/ha of phosphorus using DAP or similar.", defP)
	}
	if defK > 0 {
		resp["potassium_advice"] = fmt.Sprintf("Add %.1f kg/ha of potassium using Muriate of Potash or similar.", defK)
	}

	c.JSON(http.StatusOK, resp)
}


var soilEncoder = map[string]float32{
	"Black": 0, "Clayey": 1, "Loamy": 2, "Red": 3, "Sandy": 4,
}

var cropEncoder = map[string]float32{
	"Barley": 0, "Cotton": 1, "Ground Nuts": 2, "Maize": 3, "Millets": 4,
	"Oil seeds": 5, "Paddy": 6, "Pulses": 7, "Sugarcane": 8, "Tobacco": 9,
	"Wheat": 10,
}

var compositionMap = map[string]string{
	"Urea": "46-0-0", "DAP": "18-46-0", "14-35-14": "14-35-14",
	"28-28": "28-28-0", "20-20": "20-20-0", "17-17-17": "17-17-17",
	"10-26-26": "10-26-26", "Potassium sulfate": "0-0-50",
	"Superphosphate": "0-20-0", "Ammonium sulfate": "21-0-0",
}

func encodeSoil(s string) float32 {
	if v, ok := soilEncoder[s]; ok {
		return v
	}
	return 0
}

func encodeCrop(s string) float32 {
	if v, ok := cropEncoder[s]; ok {
		return v
	}
	return 10
}

func fertilizerComposition(name string) string {
	if v, ok := compositionMap[name]; ok {
		return v
	}
	return "Varies"
}

func applicationAdvice(fertilizer, crop string) string {
	advice := ""
	switch {
	case strings.Contains(fertilizer, "Urea"):
		advice = "Apply in split doses — half at planting and half during vegetative growth."
	case strings.Contains(fertilizer, "DAP"):
		advice = "Best applied at planting time, can be mixed with seeds."
	case strings.Contains(fertilizer, "Potash"), strings.Contains(fertilizer, "potassium"):
		advice = "Apply during early growth stages for best results."
	case strings.Contains(fertilizer, "Superphosphate"):
		advice = "Apply before planting and incorporate into soil."
	case strings.Contains(fertilizer, "Ammonium"):
		advice = "Apply in moist soil conditions for best results."
	default:
		advice = "Apply as basal dose at planting time."
	}
	lc := strings.ToLower(crop)
	switch {
	case lc == "rice" || lc == "wheat" || lc == "paddy":
		advice += " For cereals, incorporate into soil before planting."
	case lc == "cotton" || lc == "sugarcane":
		advice += " For commercial crops, apply in bands along the rows."
	}
	return advice
}
