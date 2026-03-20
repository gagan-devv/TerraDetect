// esp32_terradetect.ino
// TerraDetect: Secure ESP32 sketch for device data transfer
//
// SETUP:
//   1. Copy secrets.h.template -> secrets.h
//   2. Fill in your DEVICE_API_KEY, PROVISIONED_DEVICE_ID, and BACKEND_URL
//   3. secrets.h is gitignored — never commit it
//
// CHANGES FROM PREVIOUS VERSION:
//   - API key and device ID moved to secrets.h (no credentials in source)
//   - TLS certificate pinning via setCACert() — setInsecure() removed
//   - Both validateDeviceID() and sendSensorPayload() use WiFiClientSecure
//   - BACKEND_URL defined once in secrets.h, used everywhere
//   - ArduinoOTA + watchdog timer added for production reliability

#include <WiFi.h>
#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <EEPROM.h>
#include <ArduinoOTA.h>
#include "esp_task_wdt.h"
#include "secrets.h"

// ── secrets.h must define these: ──────────────────────────────────────────────
// #define DEVICE_API_KEY        "your-64-char-hex-api-key"
// #define PROVISIONED_DEVICE_ID "ABC123"
// #define BACKEND_URL           "https://terradetect.onrender.com"
// ──────────────────────────────────────────────────────────────────────────────

#define DEVICE_ID_MAXLEN 32
#define EEPROM_SIZE      64
#define DEVICE_ID_ADDR   0
#define LED_PIN          2
#define WDT_TIMEOUT_MS   10000

// ISRG Root X1 — root CA for Let's Encrypt (used by onrender.com)
// Verify at: https://letsencrypt.org/certificates/
static const char* ROOT_CA = \
"-----BEGIN CERTIFICATE-----\n"
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n"
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n"
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n"
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n"
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoBggIBAK3oJHP0FDfzm54rVygc\n"
"h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+\n"
"0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U\n"
"A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW\n"
"T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH\n"
"B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC\n"
"B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv\n"
"KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn\n"
"OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn\n"
"jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw\n"
"qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI\n"
"rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\n"
"HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq\n"
"hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL\n"
"ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ\n"
"3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK\n"
"NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5\n"
"ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur\n"
"TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC\n"
"jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc\n"
"oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq\n"
"4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA\n"
"mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d\n"
"emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=\n"
"-----END CERTIFICATE-----\n";

WiFiManagerParameter custom_device_id("device_id", "Enter Device ID", "", DEVICE_ID_MAXLEN);
String deviceID = "";
unsigned long lastSendTime = 0;
const unsigned long sendInterval = 60000;

// ── Helpers ───────────────────────────────────────────────────────────────────

void blinkLED(int times, int duration = 300) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH); delay(duration);
    digitalWrite(LED_PIN, LOW);  delay(duration);
  }
}

void saveDeviceID(const String &id) {
  EEPROM.begin(EEPROM_SIZE);
  for (int i = 0; i < DEVICE_ID_MAXLEN; i++) {
    EEPROM.write(DEVICE_ID_ADDR + i, (i < (int)id.length()) ? id[i] : '\0');
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
  String id = String(buf);
  // Reject uninitialised EEPROM (all 0xFF bytes)
  if (id.length() == 0 || id[0] == '\xFF') return "";
  return id;
}

// All HTTPS calls go through this — never use http.begin(url) without a
// WiFiClientSecure that has the root CA set.
WiFiClientSecure makeSecureClient() {
  WiFiClientSecure client;
  client.setCACert(ROOT_CA);   // pins ISRG Root X1 — no setInsecure()
  return client;
}

// ── Network calls ─────────────────────────────────────────────────────────────

bool validateDeviceID(const char* device_id) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Validation] Not connected to WiFi!");
    blinkLED(3);
    return false;
  }

  WiFiClientSecure client = makeSecureClient();
  HTTPClient http;
  http.begin(client, String(BACKEND_URL) + "/api/v1/device/check");
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"device_id\":\"" + String(device_id) + "\"}";
  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  Serial.printf("[Validation] Code: %d  Response: %s\n", code, response.c_str());

  if (code == 200 && response.indexOf("\"registered\":true") != -1) {
    return true;
  }
  blinkLED(5);
  return false;
}

void sendSensorPayload() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Data] Not connected to WiFi!");
    blinkLED(2);
    return;
  }

  // ── TODO: replace simulated values with real sensor reads ──────────────────
  float temperature = 25.5;  // replace with DS18B20 / DHT read
  float ph          = 6.7;   // replace with analog pH probe read
  float humidity    = 55.2;  // replace with sensor read
  float ec          = 1.1;   // replace with EC probe read
  int   N           = 45;    // replace with RS485 NPK sensor read
  int   P           = 30;
  int   K           = 40;
  int   moisture    = 60;    // replace with moisture sensor read
  // ──────────────────────────────────────────────────────────────────────────

  String payload = "{";
  payload += "\"device_id\":\""  + deviceID               + "\",";
  payload += "\"temperature\":"  + String(temperature, 2) + ",";
  payload += "\"ph\":"           + String(ph, 2)           + ",";
  payload += "\"humidity\":"     + String(humidity, 1)     + ",";
  payload += "\"ec\":"           + String(ec, 2)           + ",";
  payload += "\"N\":"            + String(N)                + ",";
  payload += "\"P\":"            + String(P)                + ",";
  payload += "\"K\":"            + String(K)                + ",";
  payload += "\"moisture\":"     + String(moisture);
  payload += "}";

  Serial.println("[Data] Sending: " + payload);

  WiFiClientSecure client = makeSecureClient();
  HTTPClient http;
  http.begin(client, String(BACKEND_URL) + "/api/esp32");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);   // from secrets.h

  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  if (code > 0) {
    Serial.printf("[Data] Code: %d  Response: %s\n", code, response.c_str());
    if (code < 200 || code >= 300) blinkLED(4);
  } else {
    Serial.printf("[Data] POST failed: %s\n", http.errorToString(code).c_str());
    blinkLED(4);
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(1000);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("\n[TerraDetect] Starting...");

  deviceID = loadDeviceID();
  if (deviceID.length() > 0) {
    Serial.println("[EEPROM] Loaded device_id: " + deviceID);
  }

  WiFiManager wm;
  if (deviceID.length() > 0) {
    custom_device_id.setValue(deviceID.c_str(), DEVICE_ID_MAXLEN);
  }
  wm.addParameter(&custom_device_id);

  if (!wm.autoConnect("TerraDetect-Setup")) {
    Serial.println("[WiFiManager] Failed to connect. Restarting...");
    blinkLED(6);
    delay(3000);
    ESP.restart();
  }

  Serial.println("[WiFiManager] Connected. IP: " + WiFi.localIP().toString());

  deviceID = String(custom_device_id.getValue());
  Serial.println("[Device ID] Entered: " + deviceID);

  if (deviceID.length() == 0) {
    Serial.println("[Error] Device ID is empty. Restarting...");
    blinkLED(7);
    wm.resetSettings();
    delay(2000);
    ESP.restart();
  }

  // 2FA: ID entered in portal must match the ID pre-flashed in secrets.h
  if (deviceID != String(PROVISIONED_DEVICE_ID)) {
    Serial.println("[2FA] Device ID mismatch. Restarting...");
    blinkLED(7);
    wm.resetSettings();
    delay(2000);
    ESP.restart();
  }

  // Server-side registration check
  if (!validateDeviceID(deviceID.c_str())) {
    Serial.println("[Validation] Device not registered. Restarting...");
    wm.resetSettings();
    delay(2000);
    ESP.restart();
  }

  saveDeviceID(deviceID);
  Serial.println("[Setup] Device verified. Starting data loop...");

  ArduinoOTA.begin();

  // Watchdog: reboot automatically if loop() stalls > WDT_TIMEOUT_MS
  esp_task_wdt_config_t wdt_config = {
    .timeout_ms     = WDT_TIMEOUT_MS,
    .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
    .trigger_panic  = true,
  };
  esp_task_wdt_init(&wdt_config);
  esp_task_wdt_add(NULL);

  lastSendTime = millis();
}

// ── Loop ──────────────────────────────────────────────────────────────────────

void loop() {
  esp_task_wdt_reset();
  ArduinoOTA.handle();

  if (millis() - lastSendTime >= sendInterval) {
    sendSensorPayload();
    lastSendTime = millis();
  }
}
