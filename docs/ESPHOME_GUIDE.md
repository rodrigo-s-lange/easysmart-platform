# 📡 ESPHome Integration Guide

Como criar e configurar dispositivos IoT usando ESPHome.

---

## 🎯 O Que é ESPHome?

ESPHome é um sistema para controlar ESP32/ESP8266 via **arquivos YAML simples**.

### Vantagens

- ✅ Zero código C++ necessário
- ✅ Configuração declarativa (YAML)
- ✅ OTA updates (sem cabo USB)
- ✅ MQTT nativo
- ✅ Dezenas de sensores/atuadores suportados

---

## 🚀 Quick Start

### 1️⃣ Acessar ESPHome Dashboard
```
http://localhost:6052
```

### 2️⃣ Criar Novo Device

1. Clique em **"+ NEW DEVICE"**
2. Nome: `sensor-temperatura-sala`
3. Device Type: `ESP32-WROOM-32`
4. Copie template YAML de `esphome-examples/devices/`

### 3️⃣ Configurar MQTT

No YAML do device, inclua:
```yaml
mqtt:
  broker: 192.168.X.X  # IP do servidor
  port: 1883
  username: devices
  password: !secret mqtt_password
  discovery: true
  topic_prefix: easysmart/ESP32_001
```

### 4️⃣ Upload do Firmware

**Primeira vez (via USB):**
1. Conecte ESP32 via USB
2. Clique em **"INSTALL"** → **"Plug into this computer"**
3. Aguarde compilação e upload

**Próximas vezes (OTA):**
1. Clique em **"INSTALL"** → **"Wirelessly"**
2. Upload automático via WiFi!

---

## 📋 Exemplo: Sensor de Temperatura
```yaml
esphome:
  name: sensor-sala
  platform: ESP32
  board: esp32dev

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

mqtt:
  broker: !secret mqtt_broker
  username: !secret mqtt_username
  password: !secret mqtt_password
  topic_prefix: easysmart/sensor_sala

# Sensor DHT22
sensor:
  - platform: dht
    pin: GPIO4
    temperature:
      name: "Temperatura Sala"
      id: temp_sala
    humidity:
      name: "Umidade Sala"
      id: humidity_sala
    update_interval: 60s

# LED de status
light:
  - platform: binary
    name: "LED Status"
    output: led_output

output:
  - platform: gpio
    pin: GPIO2
    id: led_output
```

---

## 🔧 Templates Disponíveis

Veja `esphome-examples/devices/`:

- `basic-sensor.yaml` - Temperatura + Umidade
- `relay-controller.yaml` - Controle de relés
- `multi-sensor.yaml` - Múltiplos sensores

---

**Mais info:** https://esphome.io/guides/
