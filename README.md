# 🌱 TerraDetect – A Smart Agriculture Solution

[![Live](https://img.shields.io/badge/Live-Demo-00C853?style=flat-square&logo=vercel&logoColor=white)](https://terradetect.onrender.com)
[![Go Backend](https://img.shields.io/badge/Backend-Go-00ADD8?style=flat-square&logo=go)](https://go.dev)
[![React Native](https://img.shields.io/badge/Mobile-React%20Native-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32-3C873A?style=flat-square&logo=esphome)](https://www.espressif.com/en/products/socs/esp32)

> 🔗 **Live Demo**: [https://terradetect.onrender.com](https://terradetect.onrender.com)

---

TerraDetect is a comprehensive smart farming platform that combines real-time **soil monitoring**, **IoT sensor integration**, and **ML-powered crop & fertilizer recommendations**. The system features a Go backend with ONNX inference, React Native mobile app with Expo, and ESP32 microcontrollers for environmental data collection.

---

## 🔧 Key Features

### 📱 Mobile App (React Native + Expo)
- � Modern Material Design 3 UI with dark mode support
- 📊 Real-time sensor data visualization with telemetry cards
- 🌾 ML-powered crop, fertilizer, and suitability predictions
- 📈 Historical data tracking and analysis
- � User authentication with JWT tokens
- 🎭 **Guest Mode** - Try predictions without registration
- � Offline support with request queuing
- � Cross-platform (iOS & Android)

### �️ Backend (Go + MongoDB)
- ⚡ High-performance REST API with Gin framework
- 🧠 ONNX Runtime for ML inference (crop & fertilizer models)
- 🔐 JWT authentication with refresh tokens
- 👥 User and device management
- 📊 Sensor data storage and retrieval
- 🎭 Guest token system for anonymous predictions
- 🔒 Rate limiting and security middleware
- 📡 CORS support for cross-origin requests

### 🔌 IoT Integration (ESP32)
- 📡 WiFi connectivity with dynamic configuration
- 🔐 Device ID authentication (format: AB1234)
- 📈 HTTPS sensor data uploads with API key validation
- 🌿 Multi-sensor support:
  - Soil pH
  - Moisture
  - Temperature & Humidity
  - EC (Electrical Conductivity)
  - NPK (Nitrogen, Phosphorus, Potassium)

### 🤖 Machine Learning
- 🌾 Crop recommendation (23 crop types)
- 🧪 Fertilizer suggestion (7 fertilizer types)
- 📊 Crop suitability analysis
- ⚡ ONNX models for fast inference
- 🎯 Confidence scores for predictions

---

## 📁 Project Structure

```
TerraDetect/
├── backend/              # Go backend server
│   ├── handlers/         # API route handlers
│   ├── middleware/       # Auth, rate limiting, CORS
│   ├── models/           # Data models (User, Device, Sensor)
│   ├── inference/        # ONNX ML inference engine
│   ├── db/               # MongoDB connection
│   └── main.go           # Server entry point
├── mobile/               # React Native mobile app
│   ├── app/              # Expo Router pages
│   │   ├── (app)/        # Authenticated screens
│   │   └── (auth)/       # Auth screens (login, register, guest)
│   ├── components/       # Reusable UI components
│   ├── store/            # Zustand state management
│   ├── lib/              # API client & utilities
│   └── assets/           # Images, icons, fonts
├── ml/                   # Machine learning models
│   ├── crop-model.onnx   # Crop recommendation model
│   ├── fertilizer-model.onnx  # Fertilizer suggestion model
│   └── *.py              # Model training & conversion scripts
├── sketches/             # ESP32 Arduino firmware
│   └── esp32_terradetect.ino
└── docs/                 # API documentation
```

---

## 🚀 Getting Started

### 🧰 Prerequisites
- **Backend**: Go 1.21+, MongoDB 4.4+
- **Mobile**: Node.js 18+, npm/yarn, Expo CLI
- **IoT**: ESP32-WROOM-32, Arduino IDE or PlatformIO
- **ML**: Python 3.9+ (for model training/conversion)

### ⚙️ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Go dependencies
go mod download

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Run the server
go run .
```

The backend will start on `http://localhost:8080`

### 📱 Mobile App Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start Expo development server
npx expo start

# Scan QR code with Expo Go app (iOS/Android)
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

### 📡 ESP32 Setup

1. Open `sketches/esp32_terradetect.ino` in Arduino IDE
2. Install required libraries:
   - WiFiManager
   - HTTPClient
   - ArduinoJson
3. Copy `secrets.h.template` to `secrets.h` and configure:
   - API endpoint URL
   - Device ID
   - API key
4. Upload to ESP32 board
5. On first boot, connect to ESP32 AP to configure WiFi

### 🤖 ML Model Training (Optional)

```bash
# Navigate to ml directory
cd ml

# Train models (if needed)
python train_crop_model.py
python train_fertilizer_model.py

# Convert to ONNX format
python export_onnx.py

# Validate ONNX models
python validate_onnx.py
```

---

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/guest` - Get guest token (30 min)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Sensor Data (Authenticated)
- `GET /api/v1/sensor/latest` - Get latest sensor reading
- `GET /api/v1/sensor/history` - Get historical data (paginated)

### Predictions (Authenticated)
- `POST /api/v1/predict/crop` - Crop recommendation
- `POST /api/v1/predict/fertilizer` - Fertilizer suggestion
- `POST /api/v1/predict/suitability` - Crop suitability analysis

### Guest Predictions (No Auth Required)
- `POST /api/v1/guest/predict/crop` - Guest crop prediction
- `POST /api/v1/guest/predict/fertilizer` - Guest fertilizer prediction
- `POST /api/v1/guest/predict/suitability` - Guest suitability analysis

### Device Management
- `POST /api/v1/device/check` - Check device availability
- `POST /api/esp32` - ESP32 sensor data upload (API key required)

See [docs/api.md](docs/api.md) for detailed API documentation.

---

## 🔒 Security Features

- 🔑 JWT-based authentication with access & refresh tokens
- 🎭 Guest tokens with limited permissions (30-minute expiry)
- 🔐 API key validation for ESP32 devices
- 🛡️ Rate limiting on all endpoints
- 🚫 CORS protection with configurable origins
- 🔒 Password hashing with bcrypt
- 📊 User-specific data isolation
- 🧠 Device identity validation (format: AB1234)

---

## 🧑‍🌾 Use Cases

- 🌾 **Farmers**: Real-time soil monitoring and crop recommendations
- 🎓 **Students**: Learning platform for Agri-IoT and ML applications
- 🔬 **Researchers**: Field data collection and analysis
- 🏢 **Agribusinesses**: Precision agriculture and resource optimization
- 🌱 **Home Gardeners**: Smart gardening with data-driven insights
- 👥 **Consultants**: Try predictions as guest without registration

---

## 🎯 Key Improvements in v2.0

- ✅ **Complete rewrite** from Flask to Go for better performance
- ✅ **Native mobile app** with React Native + Expo
- ✅ **Guest mode** for trying predictions without registration
- ✅ **ONNX inference** for faster ML predictions
- ✅ **Real-time telemetry** dashboard with live sensor data
- ✅ **Offline support** with request queuing
- ✅ **Material Design 3** UI with dark mode
- ✅ **Enhanced security** with JWT refresh tokens
- ✅ **Better error handling** and user feedback
- ✅ **Comprehensive API** documentation

---

## 🖼️ Preview

![TerraDetect Dashboard](https://github.com/gagan-ahlawat-0/TerraDetect---A-Smart-Agriculture-Solution/blob/main/static/dashboard_darkmode.png)

---

## ⚙️ Tech Stack

| Layer            | Technologies                                    |
|------------------|-------------------------------------------------|
| **Mobile App**   | React Native, Expo, TypeScript, NativeWind      |
| **Backend**      | Go, Gin, MongoDB, ONNX Runtime                  |
| **ML Models**    | Python, Scikit-learn, ONNX                      |
| **IoT Hardware** | ESP32, RS485 NPK sensor, analog sensors         |
| **Auth**         | JWT, bcrypt, guest tokens                       |
| **State Mgmt**   | Zustand (mobile)                                |
| **Styling**      | TailwindCSS (NativeWind), Material Design 3     |
| **API**          | REST, JSON, CORS                                |

---

## 📬 Contact

Developed by [**Gagan Ahlawat**](https://github.com/gagan-ahlawat-0) and Team **TerraDetect**
🔗 [https://terradetect.onrender.com](https://terradetect.onrender.com)

Contributions, issues, and feature requests are welcome!

---
