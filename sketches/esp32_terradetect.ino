// esp32_terradetect.ino
// TerraDetect: Fully functional ESP32 sketch for secure device data transfer
// - User enters device_id via WiFiManager captive portal
// - device_id is validated with backend
// - device_id is stored in EEPROM for persistence
// - Periodically sends sensor data (simulated here) to backend with API key
// - All steps and errors are printed to Serial
// - Uses HTTPS and x-api-key header

#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <EEPROM.h>

#define API_KEY "YOUR_API_KEY_HERE" // <-- Replace with your actual API key
#define PROVISIONED_DEVICE_ID "PROVISIONED_ID_HERE" // <-- Set this to the unique device ID for this device
#define DEVICE_ID_MAXLEN 32
#define EEPROM_SIZE 64
#define DEVICE_ID_ADDR 0

WiFiManagerParameter custom_device_id("device_id", "Enter Device ID", "", DEVICE_ID_MAXLEN);
String deviceID = "";
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 60000; // 60 seconds

void saveDeviceID(const String &id) {
  EEPROM.begin(EEPROM_SIZE);
  for (int i = 0; i < DEVICE_ID_MAXLEN; i++) {
    char c = (i < id.length()) ? id[i] : '\0';
    EEPROM.write(DEVICE_ID_ADDR + i, c);
  }
  EEPROM.commit();
  EEPROM.end();
}

String loadDeviceID() {
  EEPROM.begin(EEPROM_SIZE);
  char buf[DEVICE_ID_MAXLEN];
  for (int i = 0; i < DEVICE_ID_MAXLEN; i++) {
    buf[i] = EEPROM.read(DEVICE_ID_ADDR + i);
  }
  buf[DEVICE_ID_MAXLEN - 1] = '\0';
  EEPROM.end();
  return String(buf);
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[TerraDetect ESP32] Starting...");

  // Try to load device_id from EEPROM
  deviceID = loadDeviceID();
  if (deviceID.length() > 0 && deviceID != String("\xFF")) {
    Serial.print("[EEPROM] Loaded device_id: ");
    Serial.println(deviceID);
  } else {
    deviceID = "";
  }

  WiFiManager wm;
  if (deviceID.length() > 0) {
    custom_device_id.setValue(deviceID.c_str(), DEVICE_ID_MAXLEN);
  }
  wm.addParameter(&custom_device_id);

  // Start WiFiManager portal
  if (!wm.autoConnect("TerraDetect-Setup")) {
    Serial.println("[WiFiManager] Failed to connect. Restarting...");
    ESP.restart();
  }

  Serial.println("[WiFiManager] Connected to WiFi!");
  Serial.print("[WiFiManager] IP Address: ");
  Serial.println(WiFi.localIP());

  // Copy the entered device_id safely
  deviceID = String(custom_device_id.getValue());
  Serial.print("[Device ID] User entered: ");
  Serial.println(deviceID);

  // Check if empty
  if (deviceID.length() == 0) {
    Serial.println("[Error] Device ID is empty. Restarting...");
    delay(2000);
    wm.resetSettings();
    ESP.restart();
  }

  // Two-factor: check against provisioned device ID
  if (deviceID != String(PROVISIONED_DEVICE_ID)) {
    Serial.println("[2FA] Entered device ID does not match provisioned device ID. Restarting...");
    delay(2000);
    wm.resetSettings();
    ESP.restart();
  }

  // Validate with backend
  if (validateDeviceID(deviceID.c_str())) {
    Serial.println("[Verification] Device ID is registered. Starting data loop...");
    saveDeviceID(deviceID);
    lastSendTime = millis();
  } else {
    Serial.println("[Verification] Device ID NOT registered. Resetting WiFi...");
    delay(2000);
    wm.resetSettings();
    ESP.restart();
  }
}

void loop() {
  if (millis() - lastSendTime >= sendInterval) {
    sendSensorPayload();
    lastSendTime = millis();
  }
}

bool validateDeviceID(const char* device_id) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Verification] Not connected to WiFi!");
    return false;
  }
  HTTPClient http;
  http.begin("https://terradetect.onrender.com/api/check_device_id");
  http.addHeader("Content-Type", "application/json");
  String payload = "{\"device_id\":\"" + String(device_id) + "\"}";
  int code = http.POST(payload);
  String response = http.getString();
  http.end();
  Serial.printf("[Verification] POST Code: %d, Response: %s\n", code, response.c_str());
  return (code == 200 && response.indexOf("\"registered\":true") != -1);
}

void sendSensorPayload() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Data] Not connected to WiFi!");
    return;
  }
  HTTPClient http;
  http.begin("https://terradetect.onrender.com/api/esp32");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);

  // Simulated sensor data (replace with real sensor reads)
  float temperature = 25.5; // TODO: replace with real sensor
  float ph = 6.7;           // TODO: replace with real sensor
  float humidity = 55.2;    // TODO: replace with real sensor
  float ec = 1.1;           // TODO: replace with real sensor
  int N = 45;               // TODO: replace with real sensor
  int P = 30;               // TODO: replace with real sensor
  int K = 40;               // TODO: replace with real sensor
  int moisture = 60;        // TODO: replace with real sensor

  String payload = "{";
  payload += "\"device_id\":\"" + deviceID + "\",";
  payload += "\"temperature\":" + String(temperature, 2) + ",";
  payload += "\"ph\":" + String(ph, 2) + ",";
  payload += "\"humidity\":" + String(humidity, 1) + ",";
  payload += "\"ec\":" + String(ec, 2) + ",";
  payload += "\"N\":" + String(N) + ",";
  payload += "\"P\":" + String(P) + ",";
  payload += "\"K\":" + String(K) + ",";
  payload += "\"moisture\":" + String(moisture);
  payload += "}";

  Serial.print("[Data] Sending payload: ");
  Serial.println(payload);

  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  if (code > 0) {
    Serial.printf("[Data] POST Code: %d\n[Data] Response: %s\n", code, response.c_str());
  } else {
    Serial.printf("[Data] POST Failed. Error: %s\n", http.errorToString(code).c_str());
  }
} 