# 🏭 EasySmart IoT Platform

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20.x-green)
![ESPHome](https://img.shields.io/badge/ESPHome-compatible-purple)
![Status](https://img.shields.io/badge/status-in%20development-yellow)

> **Multi-tenant SaaS IoT platform** usando ESPHome + MQTT para dispositivos ESP32/ESP8266

---

## 🎯 Visão Geral

EasySmart permite criar, gerenciar e monitorar dispositivos IoT usando **ESPHome** para firmware e uma **interface web customizada** para visualização e controle.

### Por Que ESPHome?

- ✅ **Zero código C++** - Configuração via YAML
- ✅ **Auto-discovery** - Dispositivos se registram automaticamente
- ✅ **OTA Updates** - Atualização remota de firmware
- ✅ **MQTT nativo** - Comunicação confiável
- ✅ **Entidades prontas** - Sensores, switches, números, textos
- ✅ **Compatível com Home Assistant** - Integração opcional

---

## 🏗️ Arquitetura
```
┌──────────────┐
│   ESP32      │  ← ESPHome Firmware (YAML)
│  (Device)    │
└──────┬───────┘
       │ MQTT
       ▼
┌──────────────────┐
│   Mosquitto      │  ← Message Broker
└─────┬────────────┘
      │
      ├─────────────────┬──────────────┐
      ▼                 ▼              ▼
┌──────────┐    ┌─────────────┐  ┌──────────┐
│PostgreSQL│    │  InfluxDB   │  │  Backend │
│Metadata  │    │Time-Series  │  │ Node.js  │
└──────────┘    └─────────────┘  └────┬─────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │    Frontend    │
                              │     React      │
                              └────────────────┘
```

---

## 🚀 Quick Start

### Pré-requisitos

- Docker & Docker Compose
- Node.js 20.x (desenvolvimento local)
- ESPHome (já incluído no stack)

### 1️⃣ Infraestrutura Base

A infraestrutura (PostgreSQL, InfluxDB, Mosquitto, ESPHome) já está rodando em:
```
~/docker/docker-compose.yml
```

Serviços disponíveis:
- PostgreSQL: `localhost:5432`
- InfluxDB: `localhost:8086`
- Mosquitto MQTT: `localhost:1883`
- ESPHome: `localhost:6052`

### 2️⃣ Backend API
```bash
cd backend
npm install
npm run dev
```

Backend roda em: `http://localhost:3001`

### 3️⃣ Frontend
```bash
cd frontend
npm install
npm start
```

Frontend roda em: `http://localhost:3000`

### 4️⃣ Criar Dispositivo ESPHome

1. Acesse ESPHome: `http://localhost:6052`
2. Crie novo device com YAML template de `esphome-examples/`
3. Compile e faça upload OTA
4. Device aparece automaticamente no dashboard!

---

## 📡 MQTT Topics

### Estrutura de Topics
```
easysmart/{DEVICE_ID}/sensor/{ENTITY_ID}/state       # Leitura de sensores
easysmart/{DEVICE_ID}/switch/{ENTITY_ID}/state       # Estado de switches
easysmart/{DEVICE_ID}/switch/{ENTITY_ID}/command     # Comandos para switches
easysmart/{DEVICE_ID}/number/{ENTITY_ID}/state       # Valores numéricos
easysmart/{DEVICE_ID}/availability                   # Online/Offline (LWT)
```

### Exemplo de Mensagens
```json
// Sensor de temperatura
Topic: easysmart/ESP32_001/sensor/temperature/state
Payload: {"value": 23.5, "unit": "°C"}

// Switch (relay)
Topic: easysmart/ESP32_001/switch/relay_1/state
Payload: {"state": "ON"}

// Comando para ligar relay
Topic: easysmart/ESP32_001/switch/relay_1/command
Payload: "ON"
```

---

## 📁 Estrutura do Projeto
```
easysmart-platform/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── config/         # Database, MQTT configs
│   │   ├── models/         # Data models
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth, validation
│   ├── package.json
│   └── Dockerfile
│
├── frontend/               # React App
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   └── hooks/         # Custom hooks
│   ├── package.json
│   └── Dockerfile
│
├── esphome-examples/       # Device templates
│   ├── devices/
│   │   ├── basic-sensor.yaml
│   │   ├── relay-controller.yaml
│   │   └── multi-sensor.yaml
│   └── common/
│       └── mqtt-config.yaml
│
└── docs/                   # Documentation
    ├── API.md
    ├── ESPHOME_GUIDE.md
    └── DEPLOYMENT.md
```

---

## 🔐 Segurança

- ✅ JWT Authentication
- ✅ MQTT com usuário/senha
- ✅ PostgreSQL com senha forte
- ✅ InfluxDB com token
- ✅ Variáveis em `.env` (não commitadas)

---

## 🛣️ Roadmap

### ✅ Phase 0: Infraestrutura (COMPLETO)
- Docker stack com PostgreSQL, InfluxDB, Mosquitto
- ESPHome configurado

### 🚧 Phase 1: Backend Básico (EM ANDAMENTO)
- [ ] Conexão com PostgreSQL
- [ ] Conexão com InfluxDB
- [ ] Subscribe MQTT topics
- [ ] API REST básica
- [ ] Persistência de dados

### 📋 Phase 2: Frontend
- [ ] Dashboard com cards
- [ ] Listagem de dispositivos
- [ ] Controle de switches
- [ ] Gráficos de sensores

### 📋 Phase 3: ESPHome Integration
- [ ] Templates YAML prontos
- [ ] Auto-discovery de devices
- [ ] OTA updates via interface

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

## 👤 Autor

**Rodrigo S. Lange**
- GitHub: [@rodrigo-s-lange](https://github.com/rodrigo-s-lange)
- Domain: [easysmart.com.br](https://easysmart.com.br)

---

**Built with ❤️ for the IoT community**

**Last Updated:** 2025-10-16
EOFcat > ~/easysmart-platform/README.md << 'EOF'
# 🏭 EasySmart IoT Platform

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20.x-green)
![ESPHome](https://img.shields.io/badge/ESPHome-compatible-purple)
![Status](https://img.shields.io/badge/status-in%20development-yellow)

> **Multi-tenant SaaS IoT platform** usando ESPHome + MQTT para dispositivos ESP32/ESP8266

---

## 🎯 Visão Geral

EasySmart permite criar, gerenciar e monitorar dispositivos IoT usando **ESPHome** para firmware e uma **interface web customizada** para visualização e controle.

### Por Que ESPHome?

- ✅ **Zero código C++** - Configuração via YAML
- ✅ **Auto-discovery** - Dispositivos se registram automaticamente
- ✅ **OTA Updates** - Atualização remota de firmware
- ✅ **MQTT nativo** - Comunicação confiável
- ✅ **Entidades prontas** - Sensores, switches, números, textos
- ✅ **Compatível com Home Assistant** - Integração opcional

---

## 🏗️ Arquitetura
```
┌──────────────┐
│   ESP32      │  ← ESPHome Firmware (YAML)
│  (Device)    │
└──────┬───────┘
       │ MQTT
       ▼
┌──────────────────┐
│   Mosquitto      │  ← Message Broker
└─────┬────────────┘
      │
      ├─────────────────┬──────────────┐
      ▼                 ▼              ▼
┌──────────┐    ┌─────────────┐  ┌──────────┐
│PostgreSQL│    │  InfluxDB   │  │  Backend │
│Metadata  │    │Time-Series  │  │ Node.js  │
└──────────┘    └─────────────┘  └────┬─────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │    Frontend    │
                              │     React      │
                              └────────────────┘
```

---

## 🚀 Quick Start

### Pré-requisitos

- Docker & Docker Compose
- Node.js 20.x (desenvolvimento local)
- ESPHome (já incluído no stack)

### 1️⃣ Infraestrutura Base

A infraestrutura (PostgreSQL, InfluxDB, Mosquitto, ESPHome) já está rodando em:
```
~/docker/docker-compose.yml
```

Serviços disponíveis:
- PostgreSQL: `localhost:5432`
- InfluxDB: `localhost:8086`
- Mosquitto MQTT: `localhost:1883`
- ESPHome: `localhost:6052`

### 2️⃣ Backend API
```bash
cd backend
npm install
npm run dev
```

Backend roda em: `http://localhost:3001`

### 3️⃣ Frontend
```bash
cd frontend
npm install
npm start
```

Frontend roda em: `http://localhost:3000`

### 4️⃣ Criar Dispositivo ESPHome

1. Acesse ESPHome: `http://localhost:6052`
2. Crie novo device com YAML template de `esphome-examples/`
3. Compile e faça upload OTA
4. Device aparece automaticamente no dashboard!

---

## 📡 MQTT Topics

### Estrutura de Topics
```
easysmart/{DEVICE_ID}/sensor/{ENTITY_ID}/state       # Leitura de sensores
easysmart/{DEVICE_ID}/switch/{ENTITY_ID}/state       # Estado de switches
easysmart/{DEVICE_ID}/switch/{ENTITY_ID}/command     # Comandos para switches
easysmart/{DEVICE_ID}/number/{ENTITY_ID}/state       # Valores numéricos
easysmart/{DEVICE_ID}/availability                   # Online/Offline (LWT)
```

### Exemplo de Mensagens
```json
// Sensor de temperatura
Topic: easysmart/ESP32_001/sensor/temperature/state
Payload: {"value": 23.5, "unit": "°C"}

// Switch (relay)
Topic: easysmart/ESP32_001/switch/relay_1/state
Payload: {"state": "ON"}

// Comando para ligar relay
Topic: easysmart/ESP32_001/switch/relay_1/command
Payload: "ON"
```

---

## 📁 Estrutura do Projeto
```
easysmart-platform/
├── backend/                 # API Node.js
│   ├── src/
│   │   ├── config/         # Database, MQTT configs
│   │   ├── models/         # Data models
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Auth, validation
│   ├── package.json
│   └── Dockerfile
│
├── frontend/               # React App
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   └── hooks/         # Custom hooks
│   ├── package.json
│   └── Dockerfile
│
├── esphome-examples/       # Device templates
│   ├── devices/
│   │   ├── basic-sensor.yaml
│   │   ├── relay-controller.yaml
│   │   └── multi-sensor.yaml
│   └── common/
│       └── mqtt-config.yaml
│
└── docs/                   # Documentation
    ├── API.md
    ├── ESPHOME_GUIDE.md
    └── DEPLOYMENT.md
```

---

## 🔐 Segurança

- ✅ JWT Authentication
- ✅ MQTT com usuário/senha
- ✅ PostgreSQL com senha forte
- ✅ InfluxDB com token
- ✅ Variáveis em `.env` (não commitadas)

---

## 🛣️ Roadmap

### ✅ Phase 0: Infraestrutura (COMPLETO)
- Docker stack com PostgreSQL, InfluxDB, Mosquitto
- ESPHome configurado

### 🚧 Phase 1: Backend Básico (EM ANDAMENTO)
- [ ] Conexão com PostgreSQL
- [ ] Conexão com InfluxDB
- [ ] Subscribe MQTT topics
- [ ] API REST básica
- [ ] Persistência de dados

### 📋 Phase 2: Frontend
- [ ] Dashboard com cards
- [ ] Listagem de dispositivos
- [ ] Controle de switches
- [ ] Gráficos de sensores

### 📋 Phase 3: ESPHome Integration
- [ ] Templates YAML prontos
- [ ] Auto-discovery de devices
- [ ] OTA updates via interface

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

## 👤 Autor

**Rodrigo S. Lange**
- GitHub: [@rodrigo-s-lange](https://github.com/rodrigo-s-lange)
- Domain: [easysmart.com.br](https://easysmart.com.br)

---

**Built with ❤️ for the IoT community**

**Last Updated:** 2025-10-16
