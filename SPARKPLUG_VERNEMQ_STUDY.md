# 📚 Estudo: VerneMQ + Sparkplug B para Fase 2

> **Objetivo:** Preparar implementação da Fase 2 (UNS + Sparkplug B)
> **Tempo estimado Fase 2:** 40h (1 semana)
> **Tempo estimado Fase 3:** 80h (2 semanas)

---

## 🔌 VerneMQ - MQTT Broker Enterprise

### **Por que VerneMQ vs. Mosquitto?**

| Aspecto | Mosquitto | VerneMQ |
|---------|-----------|---------|
| **Escalabilidade** | Single-node | Cluster nativo (Erlang/OTP) |
| **Webhooks** | ❌ | ✅ (Auth, ACL, On Publish) |
| **Plugins** | C/C++ | Erlang + Lua |
| **Métricas** | Limitadas | Prometheus nativo |
| **Live Config** | Restart necessário | Hot reload |
| **HA (Alta Disponibilidade)** | ❌ | ✅ Cluster automático |

### **Características Essenciais para EasySmart**

#### **1. Webhooks para Autenticação**
VerneMQ pode chamar nosso backend para validar clients:

```yaml
# vernemq.conf
plugins.vmq_webhooks = on
vmq_webhooks.mywebhook1.hook = auth_on_register
vmq_webhooks.mywebhook1.endpoint = http://backend:3010/api/v1/mqtt/auth
```

**Backend recebe:**
```http
POST /api/v1/mqtt/auth
{
  "client_id": "esp32s3-lab",
  "username": "device_token",
  "password": "easysmrt_dev_abc123..."
}
```

**Backend responde:**
```json
{
  "result": "ok",
  "modifiers": {
    "client_id": "esp32s3-lab",
    "tenant_id": "uuid"  // Custom metadata
  }
}
```

#### **2. Publish Webhooks (para telemetria)**
```yaml
vmq_webhooks.mywebhook2.hook = on_publish
vmq_webhooks.mywebhook2.endpoint = http://backend:3010/api/v1/mqtt/publish
```

Backend recebe cada publish e pode:
- Salvar no InfluxDB
- Atualizar PostgreSQL (last_seen)
- Emitir para WebSocket subscribers

#### **3. Clustering (Futuro)**
```bash
# Node 1
docker run -e DOCKER_VERNEMQ_DISCOVERY_NODE=<node2-ip> vernemq/vernemq

# Node 2 conecta automaticamente
```

### **Migração Mosquitto → VerneMQ**

**docker-compose.yml:**
```yaml
services:
  vernemq:
    image: vernemq/vernemq:latest-alpine
    ports:
      - "1883:1883"      # MQTT
      - "8883:8883"      # MQTT TLS
      - "8888:8888"      # Webhooks
      - "9100-9109:9100-9109"  # Prometheus
    environment:
      DOCKER_VERNEMQ_ACCEPT_EULA: "yes"
      DOCKER_VERNEMQ_ALLOW_ANONYMOUS: "off"
      DOCKER_VERNEMQ_PLUGINS__VMQ_WEBHOOKS: "on"
      DOCKER_VERNEMQ_VMQ_WEBHOOKS__MYWEBHOOK1__HOOK: "auth_on_register"
      DOCKER_VERNEMQ_VMQ_WEBHOOKS__MYWEBHOOK1__ENDPOINT: "http://backend:3010/api/v1/mqtt/auth"
    volumes:
      - vernemq_data:/vernemq/data
```

---

## ⚡ Sparkplug B - Protocol Specification

### **O que é Sparkplug B?**

Sparkplug B é uma **especificação MQTT** criada pela Eclipse Foundation para IIoT (Industrial IoT).

**Principais conceitos:**

#### **1. Namespace MQTT**
```
spBv1.0/{group_id}/{message_type}/{edge_node_id}/{device_id}
```

**Exemplo:**
```
spBv1.0/EasySmart/DDATA/Gateway01/esp32s3-lab
```

#### **2. Message Types**

| Type | Descrição | Quando publicar |
|------|-----------|----------------|
| **NBIRTH** | Node Birth Certificate | Node conecta |
| **DBIRTH** | Device Birth Certificate | Device registrado (=discovery) |
| **NDATA** | Node Data | Dados do gateway/edge node |
| **DDATA** | Device Data | Telemetria do device |
| **NCMD** | Node Command | Comando para o node |
| **DCMD** | Device Command | Comando para device |
| **NDEATH** | Node Death Certificate | LWT (Last Will Testament) |
| **DDEATH** | Device Death Certificate | Device desconectou |

#### **3. Payload (Protobuf)**

Sparkplug B usa **Google Protocol Buffers** para payload binário eficiente.

**Exemplo DBIRTH (Device Birth):**
```json
{
  "timestamp": 1698345678000,
  "metrics": [
    {
      "name": "temperature",
      "alias": 0,
      "timestamp": 1698345678000,
      "datatype": "Float",
      "value": 25.5
    },
    {
      "name": "humidity",
      "alias": 1,
      "timestamp": 1698345678000,
      "datatype": "Float",
      "value": 65.2
    },
    {
      "name": "button",
      "alias": 2,
      "timestamp": 1698345678000,
      "datatype": "Boolean",
      "value": false
    }
  ]
}
```

**Vantagens do Alias:**
- Primeira mensagem (DBIRTH) envia `name` + `alias`
- Mensagens seguintes (DDATA) enviam apenas `alias` + `value`
- Reduz payload em ~70%

**Exemplo DDATA (Device Data):**
```json
{
  "timestamp": 1698345680000,
  "metrics": [
    {
      "alias": 0,
      "timestamp": 1698345680000,
      "value": 26.3
    },
    {
      "alias": 1,
      "timestamp": 1698345680000,
      "value": 64.8
    }
  ]
}
```

#### **4. Quality Codes**

```javascript
{
  "alias": 0,
  "value": 26.3,
  "quality": 192  // 192 = Good Quality
}
```

| Code | Status | Descrição |
|------|--------|-----------|
| 192 | Good | Dado válido |
| 0 | Bad | Sensor falhou |
| 64 | Uncertain | Calibração expirada |

---

## 🏗️ Arquitetura UNS + Sparkplug B

### **Unified Namespace (UNS)**

**Conceito:** Todos os dados da plataforma publicados em um namespace hierárquico único.

```
/UNS
  /{tenant_id}              # acme-corp
    /{site}                 # main-plant
      /{area}               # packaging
        /{line}             # line-1
          /{cell}           # cell-a
            /{asset}        # esp32s3-lab, plc-siemens-01
              /{component}  # sensor, actuator, switch
                /{metric}   # temperature, pressure, state
```

**Exemplo completo:**
```
/UNS/acme-corp/main-plant/packaging/line-1/cell-a/esp32s3-lab/sensor/temperature
```

### **Sparkplug B + UNS Híbrido**

Podemos combinar:

#### **Opção 1: Sparkplug B Puro**
```
spBv1.0/acme-corp/DDATA/main-plant-line1/esp32s3-lab
```

Payload contém hierarquia:
```json
{
  "metrics": [
    {
      "name": "packaging/line-1/cell-a/temperature",
      "value": 26.3
    }
  ]
}
```

#### **Opção 2: UNS Topics + Sparkplug Payload** (RECOMENDADO)
```
/UNS/acme-corp/main-plant/packaging/line-1/cell-a/esp32s3-lab
```

Payload Sparkplug:
```json
{
  "timestamp": 1698345678000,
  "metrics": [
    {"alias": 0, "value": 26.3}
  ]
}
```

**Vantagem:** Topic filtering MQTT + eficiência Sparkplug.

---

## 🛠️ Implementação Prática (Fase 2/3)

### **Backend: Sparkplug Client (Node.js)**

```bash
npm install sparkplug-client
```

```javascript
const { SparkplugClient } = require('sparkplug-client');

const client = new SparkplugClient({
  serverUrl: 'mqtt://localhost:1883',
  username: 'backend',
  password: 'secret',
  groupId: 'EasySmart',
  edgeNode: 'Backend-Gateway',
  clientId: 'easysmart-backend',
});

// NBIRTH - Anunciar backend como edge node
await client.publishNodeBirth({
  timestamp: Date.now(),
  metrics: [
    {
      name: 'Node Control/Rebirth',
      type: 'Boolean',
      value: false
    }
  ]
});

// DBIRTH - Device Discovery
client.on('dbirth', async (deviceId, payload) => {
  console.log(`Device discovered: ${deviceId}`, payload.metrics);

  // Salvar no banco
  await registerDevice(deviceId, payload.metrics);
});

// DDATA - Telemetria
client.on('ddata', async (deviceId, payload) => {
  // Salvar no InfluxDB
  await saveTelemetry(deviceId, payload.metrics);

  // Emitir para WebSocket
  wss.broadcast({
    type: 'telemetry',
    deviceId,
    metrics: payload.metrics
  });
});

// DCMD - Enviar comando
async function sendCommand(deviceId, metricName, value) {
  await client.publishDeviceCommand(deviceId, {
    timestamp: Date.now(),
    metrics: [
      {
        name: metricName,
        value: value
      }
    ]
  });
}
```

### **ESP32: Firmware Sparkplug B**

**Opção A:** ESPHome + Bridge (mais fácil)
- ESPHome continua com MQTT legado
- Backend transforma em Sparkplug B

**Opção B:** Firmware Nativo (performance)
```cpp
// Arduino/ESP-IDF
#include <SparkplugB.h>

SparkplugClient sparkplug("mqtt://192.168.1.100:1883", "esp32s3-lab");

void setup() {
  // DBIRTH
  Metric metrics[] = {
    {"temperature", 0, METRIC_DATA_TYPE_FLOAT, 0.0},
    {"humidity", 1, METRIC_DATA_TYPE_FLOAT, 0.0}
  };

  sparkplug.publishDeviceBirth(metrics, 2);
}

void loop() {
  float temp = readTemperature();

  // DDATA (usando alias)
  Metric data[] = {
    {NULL, 0, METRIC_DATA_TYPE_FLOAT, temp}  // alias 0 = temperature
  };

  sparkplug.publishDeviceData(data, 1);
  delay(30000);
}
```

---

## 📋 Checklist Implementação Fase 2

### **Backend**
- [ ] Instalar `sparkplug-client`
- [ ] Criar `services/sparkplugService.js`
- [ ] Endpoint `POST /api/v1/devices/discovery`
- [ ] MQTT subscribe `easysmart/+/discovery`
- [ ] Processar DBIRTH e salvar devices
- [ ] Mapear legacy → Sparkplug
- [ ] Testes unitários

### **Infrastructure**
- [ ] Migrar docker-compose para VerneMQ
- [ ] Configurar webhooks auth
- [ ] Configurar webhooks publish
- [ ] Setup Prometheus/Grafana (métricas VerneMQ)

### **Frontend**
- [ ] Tela Discovery UI
- [ ] Aprovação de devices descobertos
- [ ] Configuração namespace UNS (site/area/line/cell)
- [ ] Visualização hierárquica UNS

### **Devices/Firmware**
- [ ] Atualizar ESPHome para enviar discovery
- [ ] (Futuro) Firmware EasySmart nativo Sparkplug B

---

## 🎓 Recursos de Aprendizado

### **VerneMQ**
- Docs: https://docs.vernemq.com/
- GitHub: https://github.com/vernemq/vernemq
- Webhooks: https://docs.vernemq.com/plugindevelopment/webhookplugins

### **Sparkplug B**
- Spec: https://www.eclipse.org/tahu/spec/Sparkplug%20Topic%20Namespace%20and%20State%20ManagementV2.2-with%20appendix%20B%20format%20-%20Eclipse.pdf
- Eclipse Tahu: https://github.com/eclipse/tahu
- Node.js Client: https://www.npmjs.com/package/sparkplug-client

### **UNS (Unified Namespace)**
- Walker Reynolds (4.0 Solutions): https://www.youtube.com/@WalkerReynoldsTV
- ISA-95 Model: https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa95

---

## 🚀 Próximos Passos

1. ✅ **Fase 1 completa** - Plataforma funcionando em produção
2. ⏳ **Fase 2 (40h)** - Discovery + UNS dual mode
3. ⏳ **Fase 3 (80h)** - Sparkplug B completo + VerneMQ
4. ⏳ **Fase 4 (120h)** - Conectores industriais (OPC UA, Modbus, EtherNet/IP)

**Quando iniciar Fase 2:** Você decide! A plataforma atual já está estável e funcional.

**Recomendação:** Teste bem a Fase 1 em produção antes de migrar para Sparkplug B.
