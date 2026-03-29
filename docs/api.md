# TerraDetect API Specification

**Version:** 2.0  
**Base URL (production):** `https://terradetect.onrender.com`  
**Base URL (local dev):** `http://localhost:8080`

---

## Overview

All API endpoints are prefixed with `/api/v1/`. The single exception is the
ESP32 data ingestion endpoint which keeps its legacy path `/api/esp32` to
avoid reflashing all deployed devices.

### Content Type

All requests and responses use `application/json` unless noted otherwise.

### Authentication

All protected endpoints require a JWT access token in the `Authorization`
header:

```
Authorization: Bearer <access_token>
```

Tokens are issued by the login endpoint and expire after **15 minutes**.
Use the refresh endpoint to get a new access token without re-authenticating.

---

## Standard Error Response

Every endpoint that fails returns this shape. No endpoint deviates from it.

```json
{
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "No device with that ID exists."
  }
}
```

### Error Codes

| Code                        | HTTP Status | Meaning                               |
| --------------------------- | ----------- | ------------------------------------- |
| `UNAUTHORIZED`              | 401         | Missing or invalid JWT                |
| `FORBIDDEN`                 | 403         | Valid JWT but insufficient permission |
| `NOT_FOUND`                 | 404         | Resource does not exist               |
| `VALIDATION_ERROR`          | 422         | Request body failed validation        |
| `INVALID_CREDENTIALS`       | 401         | Wrong username/password/device_id     |
| `DEVICE_NOT_REGISTERED`     | 403         | Device ID exists but is unregistered  |
| `DEVICE_ALREADY_REGISTERED` | 409         | Device ID already claimed by a user   |
| `INVALID_API_KEY`           | 401         | ESP32 API key does not match device   |
| `RATE_LIMITED`              | 429         | Too many requests                     |
| `INTERNAL_ERROR`            | 500         | Unexpected server error               |

---

## Rate Limits

| Endpoint group               | Limit                           |
| ---------------------------- | ------------------------------- |
| `POST /api/v1/auth/login`    | 5 requests / minute / IP        |
| `POST /api/v1/auth/register` | 3 requests / minute / IP        |
| `POST /api/esp32`            | 2 requests / second / device_id |
| All other endpoints          | 60 requests / minute / user     |

Rate limited responses return HTTP `429` with a `Retry-After` header
(seconds until the limit resets).

---

## Auth Endpoints

### Register

`POST /api/v1/auth/register`

Creates a new user account. The `device_id` field is optional. If a
`device_id` is provided it must already exist in the database with
`registered: false` (pre-provisioned by an admin). When a valid
`device_id` is provided the device will be claimed (set to
`registered: true`) and its `api_key` will be returned once. If no
`device_id` is provided the account is created without associating a
device; the user or an admin may claim a device later.

**Request (with device)**

```json
{
  "username": "gagan",
  "password": "min8chars",
  "device_id": "ABC123"
}
```

**Request (without device)**

```json
{
  "username": "gagan",
  "password": "min8chars"
}
```

| Field       | Type   | Rules                                                          |
| ----------- | ------ | -------------------------------------------------------------- |
| `username`  | string | 3–32 chars, alphanumeric + underscores                         |
| `password`  | string | min 8 chars                                                    |
| `device_id` | string | optional; if provided must be exactly 6 chars and unregistered |

**Response `201` (device claimed)**

```json
{
  "username": "gagan",
  "device_id": "ABC123",
  "api_key": "95b09474fa652e53...4d4f19f2"
}
```

**Response `201` (no device provided)**

```json
{
  "username": "gagan",
  "device_id": ""
}
```

> ⚠️ When present, `api_key` is returned only once (on successful
> registration that claims a device). The client must store it
> securely — it cannot be retrieved again and must be reset by an
> admin if lost.

---

### Login

`POST /api/v1/auth/login`

Authenticates a user and returns JWT tokens.

**Request**

```json
{
  "username": "gagan",
  "password": "min8chars",
  "device_id": "ABC123"
}
```

**Response `200`**

```json
{
  "access_token": "eyJhbGci....",
  "refresh_token": "eyJhbGci....",
  "expires_in": 900,
  "token_type": "Bearer",
  "user": {
    "username": "gagan",
    "device_id": "ABC123"
  }
}
```

| Field           | Description                                                   |
| --------------- | ------------------------------------------------------------- |
| `access_token`  | Short-lived JWT — 15 minutes. Send in `Authorization` header. |
| `refresh_token` | Long-lived JWT — 30 days. Store in secure storage only.       |
| `expires_in`    | Seconds until access token expires (always 900).              |

---

### Refresh Token

`POST /api/v1/auth/refresh`

Issues a new access token using a valid refresh token. Does not require
the `Authorization` header — uses the refresh token directly.

**Request**

```json
{
  "refresh_token": "eyJhbGci...."
}
```

**Response `200`**

```json
{
  "access_token": "eyJhbGci....",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

If the refresh token is expired or invalid, returns `401 UNAUTHORIZED`.
The client should redirect to login.

---

### Logout

`POST /api/v1/auth/logout`  
🔒 **Requires JWT**

Invalidates the refresh token server-side (added to a denylist in
MongoDB). The access token will still work until it naturally expires
(max 15 min), which is acceptable.

**Request** — empty body `{}`

**Response `200`**

```json
{
  "message": "Logged out successfully."
}
```

---

## Device Endpoints

### Check Device ID

`POST /api/v1/device/check`

Used by the ESP32 on boot to verify its device ID is registered in the
system before attempting data uploads. No auth required — the API key
check on `/api/esp32` is the actual security gate.

**Request**

```json
{
  "device_id": "ABC123"
}
```

**Response `200`**

```json
{
  "registered": true
}
```

`registered: false` means the device ID exists but hasn't been claimed
by a user yet. `404 NOT_FOUND` means the device ID doesn't exist at all.

---

## Sensor Endpoints

### Ingest ESP32 Data

`POST /api/esp32`

> ⚠️ This endpoint intentionally keeps its legacy path to avoid
> reflashing deployed ESP32 devices.

Receives sensor readings from an ESP32. Authenticated via per-device
API key in the `x-api-key` header — **not** JWT.

**Headers**

```
x-api-key: 95b09474fa652e53...4d4f19f2
Content-Type: application/json
```

**Request**

```json
{
  "device_id": "ABC123",
  "temperature": 28.45,
  "ph": 6.72,
  "humidity": 63.1,
  "ec": 1.34,
  "N": 48.2,
  "P": 31.5,
  "K": 39.8,
  "moisture": 57.3
}
```

| Field         | Type   | Unit  | Required        |
| ------------- | ------ | ----- | --------------- |
| `device_id`   | string | —     | ✅              |
| `temperature` | float  | °C    | ✅              |
| `ph`          | float  | 0–14  | ✅              |
| `humidity`    | float  | %     | ✅              |
| `ec`          | float  | μS/cm | ❌ (default 0)  |
| `N`           | float  | kg/ha | ❌ (default 0)  |
| `P`           | float  | kg/ha | ❌ (default 0)  |
| `K`           | float  | kg/ha | ❌ (default 0)  |
| `moisture`    | float  | %     | ❌ (default 40) |

**Response `200`**

```json
{
  "status": "success",
  "message": "Sensor data received.",
  "timestamp": "2025-07-12T14:32:01Z"
}
```

---

### Get Latest Sensor Reading

`GET /api/v1/sensor/latest`  
🔒 **Requires JWT**

Returns the most recent sensor document for the authenticated user's
device.

**Response `200`**

```json
{
  "data": {
    "temperature": 28.45,
    "ph": 6.72,
    "humidity": 63.1,
    "ec": 1.34,
    "N": 48.2,
    "P": 31.5,
    "K": 39.8,
    "moisture": 57.3
  },
  "timestamp": "2025-07-12T14:32:01Z",
  "source": "esp32"
}
```

`404 NOT_FOUND` if no data has been received for this device yet.

---

### Get Sensor History

`GET /api/v1/sensor/history`  
🔒 **Requires JWT**

Returns paginated historical sensor readings for the authenticated user's
device, sorted newest-first.

**Query Parameters**

| Param      | Type | Default | Max |
| ---------- | ---- | ------- | --- |
| `page`     | int  | 1       | —   |
| `per_page` | int  | 10      | 100 |

**Example:** `GET /api/v1/sensor/history?page=2&per_page=20`

**Response `200`**

```json
{
  "history": [
    {
      "temperature": 28.45,
      "ph": 6.72,
      "humidity": 63.1,
      "ec": 1.34,
      "N": 48.2,
      "P": 31.5,
      "K": 39.8,
      "moisture": 57.3,
      "timestamp": "2025-07-12T14:32:01Z"
    }
  ],
  "pagination": {
    "total": 142,
    "page": 2,
    "per_page": 20,
    "total_pages": 8
  }
}
```

---

## Prediction Endpoints

All prediction endpoints are protected by JWT. They accept either
**manual input** (user types values) or **sensor data** (values pulled
from the latest ESP32 reading).

### Crop Recommendation

`POST /api/v1/predict/crop`  
🔒 **Requires JWT**

Returns the best-matching crop and a ranked suitability list for the
given soil conditions.

**Request — manual input**

```json
{
  "source": "manual",
  "N": 48.0,
  "P": 31.0,
  "K": 40.0,
  "temperature": 28.5,
  "humidity": 63.0,
  "ph": 6.7,
  "rainfall": 120.0
}
```

**Request — from sensor**

```json
{
  "source": "sensor",
  "rainfall": 120.0
}
```

When `source` is `"sensor"`, the server fetches the latest reading for
the authenticated user's device and uses it. `rainfall` is always manual
since the ESP32 does not measure it.

| Field         | Type  | Unit  | Required (manual) |
| ------------- | ----- | ----- | ----------------- |
| `N`           | float | kg/ha | ✅                |
| `P`           | float | kg/ha | ✅                |
| `K`           | float | kg/ha | ✅                |
| `temperature` | float | °C    | ✅                |
| `humidity`    | float | %     | ✅                |
| `ph`          | float | 0–14  | ✅                |
| `rainfall`    | float | mm    | ✅ (both modes)   |

**Response `200`**

```json
{
  "recommended_crop": "rice",
  "confidence": 91.4,
  "model_prediction": "rice",
  "model_confidence": 88.2
}
```

| Field              | Description                                |
| ------------------ | ------------------------------------------ |
| `recommended_crop` | Best crop by suitability score calculation |
| `confidence`       | Suitability score (0–100)                  |
| `model_prediction` | Raw ML model output                        |
| `model_confidence` | ML model's probability (0–100)             |

---

### Crop Suitability Analysis

`POST /api/v1/predict/suitability`  
🔒 **Requires JWT**

Analyzes how well current soil conditions match a specific crop's ideal
parameters. Returns a score and per-parameter adjustment table.

**Request**

```json
{
  "source": "manual",
  "crop_name": "wheat",
  "N": 48.0,
  "P": 31.0,
  "K": 40.0,
  "temperature": 28.5,
  "humidity": 63.0,
  "ph": 6.7,
  "rainfall": 120.0
}
```

**Response `200`**

```json
{
  "crop": "wheat",
  "suitability_score": 74.3,
  "recommendations": [
    "Nitrogen (N) is too low (Current: 48.0, Ideal: 60.0). Increase by 12.0."
  ],
  "table": [
    {
      "parameter": "Nitrogen (N)",
      "recommended": 60.0,
      "observed": 48.0,
      "status": "low",
      "remarks": "Too low. Increase by 12.0. Apply nitrogen-rich fertilizers like urea or ammonium sulfate."
    },
    {
      "parameter": "pH",
      "recommended": 6.5,
      "observed": 6.7,
      "status": "optimal",
      "remarks": "Optimal"
    }
  ]
}
```

`status` is one of: `"optimal"`, `"low"`, `"high"`.

---

### Fertilizer Recommendation

`POST /api/v1/predict/fertilizer`  
🔒 **Requires JWT**

Recommends a fertilizer based on soil conditions and target crop.

**Request**

```json
{
  "source": "manual",
  "crop_name": "wheat",
  "soil_type": "Black",
  "N": 48.0,
  "P": 31.0,
  "K": 40.0,
  "temperature": 28.5,
  "humidity": 63.0,
  "ph": 6.7,
  "rainfall": 120.0,
  "moisture": 57.0
}
```

`soil_type` must be one of: `"Black"`, `"Clayey"`, `"Loamy"`, `"Red"`, `"Sandy"`.

**Response `200`**

```json
{
  "fertilizer": "Urea",
  "composition": "46-0-0",
  "deficiencies": {
    "N": 2.0,
    "P": 9.0,
    "K": 0.0
  },
  "rationale": "Recommended based on soil and crop requirements.",
  "application": "Apply in split doses - half at planting and half during vegetative growth. For cereals, incorporate into soil before planting.",
  "nitrogen_advice": "Add 2.0 kg/ha of nitrogen using Urea or similar.",
  "phosphorus_advice": "Add 9.0 kg/ha of phosphorus using DAP or similar."
}
```

---

## Weather Endpoint

### Get Current Weather

`GET /api/v1/weather`  
🔒 **Requires JWT**

Proxies a WeatherAPI.com request server-side. The API key never reaches
the client. Returns only the fields the app needs.

**Query Parameters**

| Param | Type  | Required | Description |
| ----- | ----- | -------- | ----------- |
| `lat` | float | ✅       | Latitude    |
| `lon` | float | ✅       | Longitude   |

**Example:** `GET /api/v1/weather?lat=23.18&lon=75.77`

**Response `200`**

```json
{
  "temperature": 34.2,
  "humidity": 58.0,
  "rainfall_mm": 0.0,
  "condition": "Partly cloudy",
  "location": "Ujjain, Madhya Pradesh"
}
```

`rainfall_mm` is today's precipitation total. Returns `0.0` if no rain.

---

## ESP32 Firmware Reference

This section documents what the firmware must send and how it must
authenticate. It is the implementation contract for `sketches/`.

### Boot Sequence

```
1. Load device_id from EEPROM
2. Connect WiFi via WiFiManager
3. POST /api/v1/device/check → confirm registered: true
4. If not registered → blink error, reset WiFiManager, restart
5. Begin sensor loop
```

### Data Upload (every 60 seconds)

```
POST /api/esp32
Headers:
  x-api-key: <device api key>
  Content-Type: application/json

Body: sensor payload (see Ingest ESP32 Data above)
```

### TLS

The firmware must pin the Let's Encrypt ISRG Root X1 certificate.
`client.setInsecure()` must not be used in production builds.

The root CA PEM should be stored in `sketches/secrets.h` (gitignored).
A template file `sketches/secrets.h.template` is committed with
placeholder values.

---

## MongoDB Collections Reference

For Go backend implementation — these are the exact collection shapes.

### `users`

```json
{
  "_id": "ObjectId",
  "username": "gagan",
  "password_hash": "pbkdf2:sha256:...",
  "device_id": "ABC123",
  "created_at": "ISODate"
}
```

### `device_ids`

```json
{
  "_id": "ObjectId",
  "device_id": "ABC123",
  "api_key": "95b09474fa652e53...4d4f19f2",
  "registered": true,
  "created_at": "ISODate"
}
```

### `sensor_data`

```json
{
  "_id": "ObjectId",
  "device_id": "ABC123",
  "temperature": 28.45,
  "ph": 6.72,
  "humidity": 63.1,
  "ec": 1.34,
  "N": 48.2,
  "P": 31.5,
  "K": 39.8,
  "moisture": 57.3,
  "timestamp": "ISODate"
}
```

Index required: `{ device_id: 1, timestamp: -1 }` — used by both
`/sensor/latest` (limit 1) and `/sensor/history` (paginated).

### `refresh_token_denylist`

```json
{
  "_id": "ObjectId",
  "token_hash": "sha256 of the refresh token",
  "expires_at": "ISODate"
}
```

TTL index on `expires_at` so MongoDB auto-purges expired entries.

---

## Changelog

| Version | Change                                                                                                   |
| ------- | -------------------------------------------------------------------------------------------------------- |
| 2.0     | JWT auth replacing Flask sessions; `/api/v1/` prefix; weather proxy; refresh tokens; standardized errors |
| 1.0     | Original Python Flask implementation                                                                     |
