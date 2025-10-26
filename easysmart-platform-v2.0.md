🎯 PLANO ESTRATÉGICO REVISADO - EasySmart Platform v2.0

🏗️ VISÃO ARQUITETURAL
Objetivo:
Plataforma IoT Industrial multi-tenant baseada em UNS (Unified Namespace) + Sparkplug B, compatível com:

✅ Dispositivos EasySmart (firmware proprietário)
✅ ESPHome (suporte legado/bridge)
✅ Protocolos industriais (OPC UA, Modbus TCP, EtherNet/IP)
✅ Devices de terceiros via conectores


📊 STACK TECNOLÓGICO FINAL
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (React)                    │
│  - Dashboard UNS                                     │
│  - Device Discovery UI                               │
│  - Real-time Telemetry (WebSocket)                  │
└─────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND API (Node.js)                   │
│  - Multi-tenancy (PostgreSQL)                       │
│  - REST API                                          │
│  - WebSocket Gateway                                 │
│  - Auth (JWT + refresh tokens)                      │
└─────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│          UNS BROKER (VerneMQ + Sparkplug B)         │
│  Namespace: /UNS/{tenant}/{site}/{area}/...        │
│  - NBIRTH/DBIRTH (Discovery)                        │
│  - NDATA/DDATA (Telemetria)                         │
│  - NCMD/DCMD (Comandos)                             │
│  - NDEATH/DDEATH (LWT)                              │
└─────────────────────────────────────────────────────┘
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  CONNECTOR   │ │  CONNECTOR   │ │  CONNECTOR   │
│   OPC UA     │ │  Modbus TCP  │ │ EtherNet/IP  │
│  (Client)    │ │              │ │  (libplctag) │
└──────────────┘ └──────────────┘ └──────────────┘
       ▼                 ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   PLCs       │ │   RTUs       │ │   Allen      │
│   Siemens    │ │   Modbus     │ │   Bradley    │
│   Schneider  │ │   Devices    │ │   Rockwell   │
└──────────────┘ └──────────────┘ └──────────────┘

         ▼ (Todos publicam no UNS) ▼
┌─────────────────────────────────────────────────────┐
│        TIME-SERIES DATABASE (InfluxDB 2.x)          │
│  - Retention policies                                │
│  - Agregações (1s, 1m, 1h, 1d)                      │
│  - Tags: tenant, site, area, device, metric         │
└─────────────────────────────────────────────────────┘

🚀 FASE 1 - CORREÇÕES CRÍTICAS (HOJE - 2h)
1.1 Backend - Corrigir retorno da API
Problema: /telemetry/:deviceId/:entityId retorna objeto InfluxDB, não array
Solução:
javascript// telemetryController.js
const getSeries = async (req, res) => {
  const { deviceId, entityId } = req.params;
  const { start = '-6h', stop = 'now()', window = '1m' } = req.query;
  
  const result = await influx.query(...);
  
  // ✅ RETORNAR ARRAY FLAT
  return res.json(result.map(point => ({
    _time: point._time,
    _value: point._value
  })));
};

1.2 Backend - Endpoint de Comando
Criar: POST /api/v1/devices/:deviceId/command
javascript// routes/devices.js
router.post('/:deviceId/command', requireAuth, deviceController.sendCommand);

// deviceController.js
const sendCommand = async (req, res) => {
  const { deviceId } = req.params;
  const { entityId, command } = req.body;
  
  // Publicar MQTT
  const topic = `easysmart/${deviceId}/switch/${entityId}/command`;
  await mqttClient.publish(topic, command, { qos: 1 });
  
  res.json({ success: true });
};

1.3 Frontend - Header com usuário + devices
tsx<Header>
  👤 {user.email}
  📱 {totalDevices} devices ({onlineCount} online)
  🔴 {offlineDevices.length} offline
</Header>

1.4 Frontend - Token expiration
typescriptapi.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Tentar refresh
      const refreshToken = useAuthStore.getState().refreshToken;
      const { data } = await api.post('/auth/refresh', { refreshToken });
      
      // Se sucesso, retry request
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

1.5 Frontend - Botão CSV só no gráfico
✅ Já implementado no último CollapsibleDeviceCard

🏭 FASE 2 - DISCOVERY & UNS (SEMANA 1 - 40h)
2.1 Backend - Endpoint Discovery
javascript// POST /api/v1/devices/discovery
{
  "device": {
    "id": "esp32s3-lab",
    "name": "ESP32S3 Lab Sensor",
    "model": "ESP32-S3",
    "manufacturer": "EasySmart",
    "sw_version": "1.0.0"
  },
  "entities": [
    {
      "type": "sensor",
      "id": "temperature",
      "name": "Temperature",
      "unit": "°C",
      "device_class": "temperature",
      "state_class": "measurement"
    }
  ]
}
Ações:

✅ Criar/atualizar device em PostgreSQL
✅ Criar/atualizar entities
✅ Registrar no UNS namespace


2.2 MQTT Discovery Automático
Tópico: easysmart/{deviceId}/discovery
Service:
javascriptmqttClient.subscribe('easysmart/+/discovery');

mqttClient.on('message', async (topic, payload) => {
  if (topic.endsWith('/discovery')) {
    const discovery = JSON.parse(payload);
    await deviceService.registerFromDiscovery(discovery);
  }
});

2.3 Migração UNS (Dual Mode)
Suportar AMBOS:

✅ Legado: easysmart/{deviceId}/sensor/temperature/state
✅ UNS: /UNS/{tenant}/{site}/{area}/{line}/{cell}/{deviceId}/sensor/temperature

Mapeamento:
javascriptconst legacyToUNS = (topic) => {
  // easysmart/esp32s3-lab/sensor/temperature/state
  // → /UNS/tenant123/main-plant/packaging/line1/cell-a/esp32s3-lab/sensor/temperature
  
  const [_, deviceId, entityType, entityId] = topic.split('/');
  const device = await getDevice(deviceId);
  
  return `/UNS/${device.tenantId}/${device.site}/${device.area}/${device.line}/${device.cell}/${deviceId}/${entityType}/${entityId}`;
};

2.4 Frontend - Discovery UI
tsx<DeviceList>
  {devices.map(device => (
    <DeviceCard>
      <h3>{device.name}</h3>
      <p>Model: {device.metadata.model}</p>
      <p>SW: {device.metadata.sw_version}</p>
      
      <Entities>
        {device.entities.map(entity => (
          <EntityComponent type={entity.type} {...entity} />
        ))}
      </Entities>
    </DeviceCard>
  ))}
</DeviceList>

⚡ FASE 3 - SPARKPLUG B (SEMANA 2-3 - 80h)
3.1 VerneMQ Migration
Migrar de Mosquitto → VerneMQ:
bash# docker-compose.yml
services:
  vernemq:
    image: vernemq/vernemq:latest
    ports:
      - "1883:1883"
      - "8888:8888"  # Webhooks
    environment:
      DOCKER_VERNEMQ_ACCEPT_EULA: "yes"
      DOCKER_VERNEMQ_ALLOW_ANONYMOUS: "off"
      DOCKER_VERNEMQ_PLUGINS__VMQ_DIVERSITY: "on"
      DOCKER_VERNEMQ_PLUGINS__VMQ_WEBHOOKS: "on"
      DOCKER_VERNEMQ_VMQ_WEBHOOKS__POOL_SIZE: "10"
Webhook Auth:
javascript// POST http://backend:3010/api/v1/mqtt/auth
{
  "client_id": "esp32s3-lab",
  "username": "device_token",
  "password": "secret"
}

3.2 Sparkplug B Connector
Biblioteca: sparkplug-client (Node.js)
javascriptconst { SparkplugClient } = require('sparkplug-client');

const client = new SparkplugClient({
  serverUrl: 'mqtt://localhost:1883',
  groupId: 'EasySmart',
  edgeNode: 'Gateway01',
  clientId: 'sparkplug-gateway'
});

// NBIRTH - Edge Node Birth
client.publishNodeBirth({
  metrics: [
    { name: 'Node Control/Rebirth', type: 'Boolean', value: false }
  ]
});

// DBIRTH - Device Birth (Discovery)
client.publishDeviceBirth('esp32s3-lab', {
  metrics: [
    { name: 'temperature', alias: 0, type: 'Float', value: 25.5, timestamp: Date.now() },
    { name: 'button', alias: 1, type: 'Boolean', value: false, timestamp: Date.now() }
  ]
});

// DDATA - Device Data
client.publishDeviceData('esp32s3-lab', {
  metrics: [
    { alias: 0, value: 26.3, timestamp: Date.now() }
  ]
});

// DCMD - Device Command
client.on('dcmd', (deviceId, payload) => {
  // Processar comando
});

3.3 Birth/Death Certificates
NBIRTH: Node conectou
DBIRTH: Device registrado (= discovery)
NDEATH: Node desconectou (LWT)
DDEATH: Device offline
javascript// VerneMQ LWT (Last Will Testament)
mqttClient.on('offline', (clientId) => {
  sparkplugClient.publishNodeDeath();
});

3.4 Quality + Timestamp
Sparkplug Metric:
json{
  "alias": 0,
  "timestamp": 1698345678000,
  "value": 26.3,
  "quality": 192  // 192 = Good, 0 = Bad
}
Salvar no InfluxDB:
javascriptinflux.writePoint({
  measurement: 'telemetry',
  tags: { device_id, metric: 'temperature' },
  fields: { value: 26.3, quality: 192 },
  timestamp: 1698345678000
});

🔌 FASE 4 - CONECTORES INDUSTRIAIS (SEMANA 4-6 - 120h)
4.1 OPC UA Connector ⭐ CRÍTICO
Por quê?

✅ Padrão industrial universal (Siemens, Schneider, Rockwell)
✅ PLCs, SCADAs, HMIs
✅ Browse automático de tags
✅ Subscrições em tempo real

Stack:
bashnpm install node-opcua node-opcua-client
Connector:
javascriptconst { OPCUAClient, AttributeIds } = require('node-opcua');

const client = OPCUAClient.create({
  endpoint_must_exist: false
});

await client.connect('opc.tcp://192.168.1.100:4840');
const session = await client.createSession();

// Browse tags
const browseResult = await session.browse('ns=2;s=PLC1');

// Subscribe
const subscription = await session.createSubscription2({
  requestedPublishingInterval: 1000,
  maxNotificationsPerPublish: 100
});

const monitoredItem = await subscription.monitor({
  nodeId: 'ns=2;s=PLC1.Temperature',
  attributeId: AttributeIds.Value
}, { samplingInterval: 100 });

monitoredItem.on('changed', (dataValue) => {
  // Publicar no UNS via Sparkplug
  sparkplugClient.publishDeviceData('PLC1', {
    metrics: [
      { name: 'Temperature', value: dataValue.value.value, timestamp: Date.now() }
    ]
  });
});

4.2 Modbus TCP Connector
Por quê?

✅ RTUs, inversores, medidores de energia
✅ Protocolo simples e amplamente suportado
✅ Mapeamento de registradores

Stack:
bashnpm install jsmodbus
Connector:
javascriptconst Modbus = require('jsmodbus');
const net = require('net');

const socket = new net.Socket();
const client = new Modbus.client.TCP(socket);

socket.connect({ host: '192.168.1.200', port: 502 });

// Ler holding registers
setInterval(async () => {
  const response = await client.readHoldingRegisters(0, 10);
  
  // Publicar no UNS
  sparkplugClient.publishDeviceData('ModbusRTU1', {
    metrics: [
      { name: 'voltage', value: response.body.values[0] / 10, timestamp: Date.now() },
      { name: 'current', value: response.body.values[1] / 100, timestamp: Date.now() }
    ]
  });
}, 1000);
Casos de uso:

📊 Medidores de energia (kWh, tensão, corrente)
🌡️ Sensores industriais
⚙️ Inversores de frequência
🔋 Geradores, UPS


4.3 EtherNet/IP Connector
Por quê?

✅ Padrão Allen-Bradley / Rockwell
✅ ControlLogix, CompactLogix
✅ Leitura/escrita de tags

Stack:
bashnpm install ethernet-ip
Connector:
javascriptconst { Controller } = require('ethernet-ip');

const PLC = new Controller();

await PLC.connect('192.168.1.50');

// Ler tag
const tag = PLC.newTag('Temperature');
await tag.read();

console.log(tag.value); // 25.5

// Subscribe
setInterval(async () => {
  await tag.read();
  
  sparkplugClient.publishDeviceData('PLC_AB', {
    metrics: [
      { name: 'Temperature', value: tag.value, timestamp: Date.now() }
    ]
  });
}, 1000);
```

**Casos de uso:**
- 🏭 Linhas de produção Allen-Bradley
- 📦 Automação de empacotamento
- 🔧 Manutenção preditiva em CLPs

---

## 📐 **NAMESPACE UNS PADRONIZADO**
```
/UNS
  /{tenant_id}              # Isolamento multi-tenant
    /{site}                 # Fábrica/Local (ex: main-plant, warehouse-sp)
      /{area}               # Área (ex: packaging, assembly, quality)
        /{line}             # Linha de produção (ex: line-1, line-2)
          /{cell}           # Célula/Estação (ex: cell-a, station-1)
            /{asset}        # Dispositivo (esp32s3-lab, plc-siemens-01)
              /{entity}     # Tipo (sensor, switch, binary_sensor, actuator)
                /{metric}   # Métrica (temperature, pressure, state)
```

**Exemplo real:**
```
/UNS/acme-corp/main-plant/packaging/line-1/cell-a/plc-siemens-01/sensor/temperature
/UNS/acme-corp/main-plant/packaging/line-1/cell-a/esp32s3-lab/switch/led

🎯 FIRMWARE EASYSMART vs ESPHome
EasySmart Firmware (Proprietário)
Vantagens:

✅ Sparkplug B nativo
✅ Discovery automático
✅ Birth/Death certificates
✅ Menor footprint de memória
✅ Otimizado para UNS

Desvantagens:

❌ Menos flexível que ESPHome
❌ Requer manutenção própria


ESPHome (Bridge)
Vantagens:

✅ Ecosystem maduro
✅ Fácil configuração YAML
✅ Suporte Home Assistant

Desvantagens:

❌ Não suporta Sparkplug B nativamente
❌ Precisa de bridge/adapter

Decisão: Manter AMBOS:

Firmware EasySmart → Sparkplug B nativo (preferencial)
ESPHome → Bridge MQTT legado → UNS


📅 CRONOGRAMA RESUMIDO
FaseDuraçãoEntregaFase 12hCorreções críticasFase 240h (1 semana)Discovery + UNS dualFase 380h (2 semanas)Sparkplug B + VerneMQFase 4.140hOPC UA ConnectorFase 4.240hModbus TCP ConnectorFase 4.340hEtherNet/IP ConnectorTOTAL242h (~6 semanas)Plataforma completa