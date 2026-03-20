// test_wifi.ino
// Test ESP32 data transfer to backend with preloaded payload
// Open Serial Monitor at 115200 baud to view output

#include <WiFi.h>
#include <WiFiManager.h>
#include <HTTPClient.h>

// Preload your device_id and api_key here
#define DEVICE_ID "123456"  // <-- Replace with your actual device_id
#define API_KEY   "8612790f0344e2bb2020ed604d1b29f9a2e58ee639ba4221930a33b1cd7fdfbb" // <-- Replace with your actual API key

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[ESP32 Data Test] Starting...");

  WiFiManager wifiManager;
  wifiManager.autoConnect("ESP32-DataTest");

  Serial.println("[ESP32 Data Test] Connected to WiFi!");
  Serial.print("[ESP32 Data Test] IP Address: ");
  Serial.println(WiFi.localIP());

  // Send test payload to backend
  sendTestPayload();
}

void loop() {
  // Nothing to do in loop
}

void sendTestPayload() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ESP32 Data Test] Not connected to WiFi!");
    return;
  }
  HTTPClient http;
  http.begin("https://terradetect.onrender.com/api/esp32");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);

  // Preloaded sensor data payload
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"temperature\":25.5,";
  payload += "\"ph\":6.7,";
  payload += "\"humidity\":55.2,";
  payload += "\"ec\":1.1,";
  payload += "\"N\":45,";
  payload += "\"P\":30,";
  payload += "\"K\":40,";
  payload += "\"moisture\":60";
  payload += "}";

  Serial.print("[ESP32 Data Test] Sending payload: ");
  Serial.println(payload);

  int httpResponseCode = http.POST(payload);
  Serial.print("[ESP32 Data Test] HTTP POST code: ");
  Serial.println(httpResponseCode);
  String response = http.getString();
  Serial.print("[ESP32 Data Test] Response: ");
  Serial.println(response);
  http.end();
}
