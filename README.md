# 🏠 EasySmart IoT Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.19.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![InfluxDB](https://img.shields.io/badge/InfluxDB-2.x-blue)](https://www.influxdata.com/)

> Plataforma SaaS multi-tenant para gerenciamento de dispositivos IoT usando ESP32/ESP8266 com ESPHome

**Status:** Phase 1.5 Complete ✅ | **Version:** 0.2.0 | **Production Ready:** 🟡 MVP

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [API Reference](#-api-reference)
- [MQTT Topics](#-mqtt-topics)
- [InfluxDB Schema](#-influxdb-schema)
- [Database Schema](#-database-schema)
- [Desenvolvimento](#-desenvolvimento)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [LLM Collaboration Guide](#-llm-collaboration-guide)
- [Roadmap](#-roadmap)
- [Troubleshooting](#-troubleshooting)
- [Licença](#-licença)

---

## 🎯 Visão Geral

EasySmart é uma plataforma IoT completa que permite:

- ✅ **Gerenciamento Multi-Tenant** de dispositivos IoT
- ✅ **Auto-Discovery via MQTT** (ESPHome native)
- ✅ **Telemetria em tempo real** (MQTT → InfluxDB)
- ✅ **APIs REST** para integração com frontends
- ✅ **Autenticação JWT** (access + refresh tokens)
- ✅ **Device Provisioning** com QR codes
- ✅ **Queries time-series** com agregações

### Casos de Uso

- 🏡 Automação residencial
- 🏭 Monitoramento industrial
- 🌡️ Sensoriamento ambiental
- 💡 Controle de iluminação inteligente
- 🔌 Gerenciamento de energia

---

## 🏗️ Arquitetura

### Diagrama de Componentes
```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│                    Port: 3000 (futuro)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                   │
│                        Port: 3010                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth/Users   │  │   Devices    │  │   Telemetry  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───┬─────────────┬─────────────┬──────────────────────┬──────┘
    │             │             │                      │
    │ PostgreSQL  │ InfluxDB    │ MQTT                 │
    ▼             ▼             ▼                      ▼
┌─────────┐  ┌─────────┐  ┌──────────┐         ┌──────────┐
│PostgreSQL│  │InfluxDB │  │ Mosquitto│         │ ESPHome  │
│Port: 5432│  │Port:8086│  │Port: 1883│         │Port: 6052│
└─────────┘  └─────────┘  └────┬─────┘         └──────────┘
                                │ MQTT Topics
                                ▼
                    ┌───────────────────────┐
                    │   ESP32/ESP8266       │
                    │   (ESPHome Firmware)  │
                    └───────────────────────┘
```

### Fluxo de Dados

#### 1. Discovery (Device → Cloud)
```
ESP32 → MQTT (easysmart/{device}/discovery) → Backend
  → PostgreSQL (devices, entities)
  → Cache device_uuid
```

#### 2. Telemetria (Device → Cloud)
```
ESP32 → MQTT (.../{entity}/state) → Backend
  → Normalize payload (float/bool/string)
  → Buffer (queue)
  → Batch write (500ms ou 500 pontos)
  → InfluxDB (telemetry measurement)
```

#### 3. Comandos (Cloud → Device)
```
Frontend → Backend API → MQTT publish → ESP32
```

---

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** v18.19.1+ (LTS)
- **Express** 5.1.0 (Web framework)
- **PostgreSQL** 16 (Relational DB)
- **InfluxDB** 2.x (Time-series DB)
- **MQTT.js** 5.14.1 (MQTT client)
- **Pino** 9.5.0 (Structured logging)
- **Zod** 3.25.76 (Schema validation)
- **JWT** 9.0.2 (Authentication)
- **bcrypt** 5.1.1 (Password hashing)

### Infrastructure
- **Docker** & **Docker Compose**
- **Mosquitto** MQTT Broker
- **ESPHome** (Firmware framework)
- **Portainer** (Container management)

---

## ✅ Funcionalidades Implementadas

### Phase 1.1 - Backend Base ✅
- [x] Express 5.1.0 com middlewares de segurança
- [x] Logging estruturado com Pino (pretty dev / JSON prod)
- [x] Conexões PostgreSQL, InfluxDB, MQTT
- [x] Health check endpoint
- [x] Graceful shutdown

### Phase 1.2 - Database & Auth ✅
- [x] Schema PostgreSQL (tenants, users, devices, entities)
- [x] Migrations com node-pg-migrate
- [x] JWT authentication (access + refresh tokens)
- [x] Multi-tenancy (row-level com tenant_id)
- [x] Password hashing (bcrypt)

### Phase 1.3 - Device Management ✅
- [x] CRUD de devices
- [x] Device provisioning (gerar tokens)
- [x] Device claiming (QR codes)
- [x] Entity management
- [x] Auto-discovery via MQTT

### Phase 1.4 - Device API REST ✅
- [x] `GET /api/v1/devices` - Lista devices
- [x] `GET /api/v1/devices/:id` - Detalhes
- [x] `GET /api/v1/devices/:id/entities` - Entities
- [x] `DELETE /api/v1/devices/:id` - Remove
- [x] MQTT discovery handler

### Phase 1.5 - Telemetry API ✅
- [x] MQTT listener para telemetria
- [x] Buffer + batch write no InfluxDB (500ms/500 pontos)
- [x] Retry com exponential backoff
- [x] Cache device_uuid (evita queries PostgreSQL)
- [x] Normalização de payloads (float, bool, string)
- [x] Schema InfluxDB (measurement: telemetry)
- [x] API de leitura: latest, series, metrics
- [x] Validação Zod para queries

---

## 🚀 Instalação

### Pré-requisitos

- Ubuntu 24.04 LTS (ou similar)
- Node.js >= 18.19.0
- Docker >= 20.10
- Docker Compose >= 2.0
- Git >= 2.30

### 1. Clone o repositório
```bash
git clone https://github.com/rodrigo-s-lange/easysmart-platform.git
cd easysmart-platform
```

### 2. Infraestrutura (Docker)
```bash
cd ~/docker
cp .env.example .env

# Editar senhas se necessário
nano .env

# Iniciar serviços
docker compose up -d

# Verificar
docker compose ps
```

### 3. Backend
```bash
cd ~/easysmart-platform/backend

# Instalar dependências
npm install

# Criar .env
cp .env.example .env
nano .env  # Ajustar credenciais

# Criar database
docker exec -it postgres psql -U postgres -c "CREATE DATABASE easysmart;"

# Rodar migrations
npm run migrate:up

# Iniciar
npm run dev  # Desenvolvimento
npm start    # Produção
```

---

## 🔧 Configuração

### Backend `.env`
```bash
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=easysmart
DATABASE_URL=postgresql://postgres:password@localhost:5432/easysmart

# InfluxDB
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=easysmart
INFLUXDB_BUCKET=iot_data

# MQTT
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=devices
MQTT_PASSWORD=your_mqtt_password

# Server
PORT=3010
NODE_ENV=development
LOG_LEVEL=info

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Bcrypt
BCRYPT_ROUNDS=10
```

---

## 📚 API Reference

### Base URL
```
http://localhost:3010/api/v1
```

### Authentication

#### `POST /auth/register`
Cria novo usuário e tenant

**Request:**
```json
{
  "email": "user@example.com",
  "password": "senha123456",
  "name": "Nome do Usuário"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "tenant_id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "rt_token"
  }
}
```

#### `POST /auth/login`
Autentica usuário

**Request:**
```json
{
  "email": "user@example.com",
  "password": "senha123456"
}
```

**Response:** `200 OK`
```json
{
  "user": { /* ... */ },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "rt_token"
  }
}
```

#### `POST /auth/refresh`
Renova access token

**Request:**
```json
{
  "refreshToken": "rt_token"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "new_jwt_token"
}
```

---

### Devices

**Todas as rotas exigem autenticação:** `Authorization: Bearer {token}`

#### `GET /devices`
Lista todos os devices do tenant

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "ESP32 Living Room",
    "status": "online",
    "device_token": "easysmrt_dev_...",
    "last_seen": "2025-10-16T23:00:00.000Z",
    "metadata": {
      "mqtt_id": "esp32-lab",
      "model": "ESP32",
      "manufacturer": "Espressif"
    }
  }
]
```

#### `GET /devices/:id`
Detalhes de um device

**Response:** `200 OK`
```json
{
  "device": { /* ... */ },
  "entities": [
    {
      "id": "uuid",
      "entity_type": "sensor",
      "entity_id": "temperature",
      "name": "Temperature",
      "unit": "°C",
      "device_class": "temperature"
    }
  ]
}
```

#### `POST /devices/provision`
Provisiona novo device (gera tokens)

**Request:**
```json
{
  "name": "ESP32 Kitchen",
  "template_id": null
}
```

**Response:** `201 Created`
```json
{
  "device": {
    "id": "uuid",
    "name": "ESP32 Kitchen",
    "device_token": "easysmrt_dev_...",
    "claim_token": "easysmrt_claim_...",
    "qr_code": "data:image/png;base64,..."
  }
}
```

#### `DELETE /devices/:id`
Remove device e suas entities

**Response:** `204 No Content`

---

### Telemetry

#### `GET /telemetry/:deviceId/latest/:entityId`
Retorna último valor de uma entidade

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "deviceUuid": "uuid",
    "entityId": "temperature",
    "entityType": "sensor",
    "value": 23.8,
    "field": "value_float",
    "unit": "°C",
    "timestamp": "2025-10-16T23:02:42.6Z"
  }
}
```

#### `GET /telemetry/:deviceId/:entityId`
Série temporal com agregação

**Query Params:**
- `start`: -6h (default), -24h, -7d
- `stop`: now() (default)
- `window`: 1m (default), 5m, 1h, 1d
- `aggregation`: mean (default), min, max, sum, count, first, last

**Response:** `200 OK`
```json
{
  "success": true,
  "count": 120,
  "params": {
    "deviceId": "uuid",
    "entityId": "temperature",
    "start": "-6h",
    "window": "1m",
    "aggregation": "mean"
  },
  "data": [
    {
      "timestamp": "2025-10-16T17:00:00.000Z",
      "value": 23.5,
      "field": "value_float"
    }
  ]
}
```

#### `GET /telemetry/metrics`
Métricas do Influx Writer

**Response:** `200 OK`
```json
{
  "success": true,
  "metrics": {
    "pointsWritten": 1523,
    "pointsDropped": 0,
    "writeErrors": 0,
    "lastWriteTime": "2025-10-16T23:03:38.678Z",
    "lastWriteStatus": "ok",
    "queueSize": 0,
    "cacheSize": 15
  }
}
```

---

## 📡 MQTT Topics

### Estrutura de Tópicos
```
easysmart/{DEVICE_ID}/{TYPE}/{ENTITY_ID}/{ACTION}
```

### Discovery

**Topic:** `easysmart/{device_id}/discovery`

**Payload:**
```json
{
  "device": {
    "id": "esp32-lab",
    "name": "Lab Sensor",
    "model": "ESP32",
    "manufacturer": "Espressif",
    "sw_version": "2024.1.0"
  },
  "entities": [
    {
      "type": "sensor",
      "id": "temperature",
      "name": "Temperature",
      "unit": "°C",
      "device_class": "temperature"
    },
    {
      "type": "sensor",
      "id": "humidity",
      "name": "Humidity",
      "unit": "%",
      "device_class": "humidity"
    },
    {
      "type": "switch",
      "id": "relay1",
      "name": "Relay 1"
    }
  ]
}
```

### Telemetria (Device → Cloud)

#### Sensores (Float)
**Topic:** `easysmart/{device_id}/sensor/{entity_id}/state`

**Payload:**
```json
{ "value": 23.5, "unit": "°C" }
```

ou string pura:
```
23.5
```

#### Switches/Binary Sensors (Boolean)
**Topic:** `easysmart/{device_id}/switch/{entity_id}/state`

**Payload:**
```
ON
```
ou
```
OFF
```

ou JSON:
```json
{ "state": "ON" }
```

### Comandos (Cloud → Device)

**Topic:** `easysmart/{device_id}/switch/{entity_id}/command`

**Payload:**
```
ON
```
ou
```
OFF
```

### Availability

**Topic:** `easysmart/{device_id}/availability`

**Payload:**
```
online
```
ou
```
offline
```

---

## 💾 InfluxDB Schema

### Bucket
- **Nome:** `iot_data`
- **Retenção:** 90 dias (configurável)

### Measurement
- **Nome:** `telemetry`

### Tags (Indexados)
```
tenant_id       UUID do tenant (futuro)
device_uuid     UUID do device (PostgreSQL)
mqtt_id         ID MQTT do device (ex: esp32-lab)
entity_id       ID da entidade (ex: temperature, relay1)
entity_type     Tipo (sensor, switch, binary_sensor)
device_class    Classe (temperature, humidity, power)
unit            Unidade (°C, %, W, kWh)
```

### Fields (Valores)
```
value_float     Valores numéricos (float64)
value_bool      Valores booleanos (bool)
value_string    Valores string (string)
```

**Regra:** Apenas 1 field por ponto (evita conflito de tipos)

### Exemplo de Point
```javascript
{
  measurement: "telemetry",
  tags: {
    device_uuid: "6865e0bd-3f13-458a-9a3a-e833881cb0c2",
    mqtt_id: "esp32-lab",
    entity_id: "temperature",
    entity_type: "sensor",
    device_class: "temperature",
    unit: "°C"
  },
  fields: {
    value_float: 23.5
  },
  timestamp: 1729094567000
}
```

### Query Examples (Flux)

#### Último valor
```flux
from(bucket: "iot_data")
  |> range(start: -7d)
  |> filter(fn: (r) => r._measurement == "telemetry")
  |> filter(fn: (r) => r.device_uuid == "uuid")
  |> filter(fn: (r) => r.entity_id == "temperature")
  |> last()
```

#### Série com agregação
```flux
from(bucket: "iot_data")
  |> range(start: -6h)
  |> filter(fn: (r) => r._measurement == "telemetry")
  |> filter(fn: (r) => r.device_uuid == "uuid")
  |> filter(fn: (r) => r.entity_id == "temperature")
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
```

---

## 🗄️ Database Schema

### Tables

#### `tenants`
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `device_templates`
```sql
CREATE TABLE device_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  esphome_config JSONB,
  default_entities JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `devices`
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES device_templates(id),
  name TEXT NOT NULL,
  device_token TEXT UNIQUE NOT NULL,
  claim_token TEXT UNIQUE,
  mac_address TEXT UNIQUE,
  status TEXT DEFAULT 'unclaimed',
  last_seen TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  claimed_at TIMESTAMP,
  
  INDEX idx_devices_tenant (tenant_id),
  INDEX idx_devices_status (status)
);
```

#### `entities`
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  device_class TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(device_id, entity_id),
  INDEX idx_entities_device (device_id)
);
```

#### `refresh_tokens`
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_refresh_tokens_user (user_id)
);
```

---

## 👨‍💻 Desenvolvimento

### Estrutura de Pastas
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # PostgreSQL pool
│   │   ├── influxdb.js       # InfluxDB client (legacy)
│   │   ├── logger.js         # Pino logger
│   │   └── mqtt.js           # MQTT config (legacy)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── deviceController.js
│   │   ├── deviceApiController.js
│   │   └── telemetryController.js
│   ├── middleware/
│   │   ├── auth.js           # JWT validation
│   │   └── errorHandler.js   # Global error handler
│   ├── routes/
│   │   ├── auth.js
│   │   ├── devices.js
│   │   └── telemetry.js
│   ├── services/
│   │   ├── influxService.js  # InfluxDB writer (buffer + retry)
│   │   └── mqttService.js    # MQTT listener + publisher
│   ├── utils/
│   │   └── token.js          # Token generation
│   └── server.js             # Entry point
├── migrations/
│   └── 1760638437331_create-initial-schema.js
├── tests/
├── .env
├── .env.example
├── package.json
└── README.md
```

### Conventions

#### Git Commits (Conventional Commits)
```bash
feat: nova funcionalidade
fix: correção de bug
docs: documentação
refactor: refatoração
test: testes
chore: manutenção
perf: performance
```

#### Code Style
- Indentação: 2 espaços
- Quotes: Single `'`
- Semicolons: Obrigatório
- Line length: 100 caracteres
- Naming:
  - `camelCase` para variáveis/funções
  - `PascalCase` para classes
  - `UPPER_CASE` para constantes

### Logging
```javascript
const logger = require('./config/logger');

logger.trace('trace');
logger.debug('debug');
logger.info('info');
logger.warn('warning');
logger.error({ err }, 'error');
logger.fatal({ err }, 'fatal');

// Structured
logger.info({ userId: 123, action: 'login' }, 'User logged in');
```

---

## 🧪 Testes

### E2E Testing

#### 1. Health Check
```bash
curl http://localhost:3010/health | jq
```

#### 2. Authentication
```bash
# Register
curl -X POST http://localhost:3010/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123","name":"Test User"}' | jq

# Login
TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}' \
  | jq -r '.tokens.accessToken')
```

#### 3. MQTT Discovery
```bash
docker exec mosquitto mosquitto_pub \
  -h localhost -u devices -P 'your_mqtt_password' \
  -t 'easysmart/esp32-test/discovery' \
  -m '{
    "device": {"id":"esp32-test","name":"Test Device"},
    "entities": [
      {"type":"sensor","id":"temp","name":"Temperature","unit":"°C"}
    ]
  }'
```

#### 4. MQTT Telemetry
```bash
# Float
docker exec mosquitto mosquitto_pub \
  -h localhost -u devices -P 'your_mqtt_password' \
  -t 'easysmart/esp32-test/sensor/temp/state' \
  -m '{"value": 24.5, "unit": "°C"}'

# Boolean
docker exec mosquitto mosquitto_pub \
  -h localhost -u devices -P 'your_mqtt_password' \
  -t 'easysmart/esp32-test/switch/relay1/state' \
  -m 'ON'
```

#### 5. Query Telemetry
```bash
# Latest
curl -s "http://localhost:3010/api/v1/telemetry/{device_id}/latest/temp" \
  -H "Authorization: Bearer $TOKEN" | jq

# Series
curl -s "http://localhost:3010/api/v1/telemetry/{device_id}/temp?start=-1h&window=1m" \
  -H "Authorization: Bearer $TOKEN" | jq

# Metrics
curl -s "http://localhost:3010/api/v1/telemetry/metrics" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🤖 LLM Collaboration Guide

Este projeto foi desenvolvido colaborativamente entre humanos e LLMs (Claude, ChatGPT). Use este guia para dar continuidade ao desenvolvimento.

### Context for LLMs

#### Project Status (2025-10-16)
- **Phase:** 1.5 Complete ✅
- **Next:** Phase 2.1 - Frontend Base
- **Node Version:** 18.19.1
- **Location:** `~/easysmart-platform/backend`

#### Key Architecture Decisions

1. **Multi-tenancy:** Row-level com `tenant_id` em todas as tabelas
2. **Auth:** JWT (15min access + 7d refresh)
3. **Telemetry:** Buffer (500ms/500 pontos) → Batch write InfluxDB
4. **MQTT:** Auto-discovery + telemetria em tópicos separados
5. **Schema InfluxDB:** 1 measurement (`telemetry`) + 3 fields (float/bool/string)

#### Known Issues & Solutions

**Issue:** Query series com erro "unsupported input type for mean aggregate: boolean"
**Cause:** Query pegando múltiplos fields (value_float + value_bool)
**Solution:** Filtrar apenas field desejado na query Flux:
```flux
|> filter(fn: (r) => r._field == "value_float")
```

**Issue:** Port 3001 vs 3010
**Solution:** Backend roda na porta **3010** (`.env: PORT=3010`)

**Issue:** Middleware `authenticateToken` not found
**Solution:** Nome correto é `requireAuth` em `src/middleware/auth.js`

#### Important Files to Read

1. `README.md` - Este arquivo (documentação completa)
2. `backend/src/services/influxService.js` - Writer robusto com buffer
3. `backend/src/services/mqttService.js` - Listener telemetria + discovery
4. `backend/src/server.js` - Entry point
5. `migrations/1760638437331_create-initial-schema.js` - Schema DB

#### Commands Reference
```bash
# Start backend
cd ~/easysmart-platform/backend
npm run dev

# Database
docker exec -it postgres psql -U postgres easysmart

# Migrations
npm run migrate:up
npm run migrate:down
npm run migrate:create -- migration-name

# Logs
docker logs mosquitto --tail 50
docker logs influxdb --tail 50
docker logs postgres --tail 50

# Git
git status
git add .
git commit -m "type: message"
git push origin main
Environment Variables
bash# Get credentials
grep POSTGRES_PASSWORD ~/docker/.env
grep INFLUXDB_ADMIN_TOKEN ~/docker/.env
grep MQTT_PASSWORD ~/docker/.env
Testing Workflow

Start backend: npm run dev
Publish MQTT discovery
Publish MQTT telemetry
Query via API (need JWT token)
Check logs for errors

Next Steps Recommendations
Phase 2.1 - Frontend Base

Setup React + Vite + TypeScript
Login/Register pages
Dashboard layout
Device list component
Real-time telemetry charts (recharts or chart.js)

Phase 1.6 - Enhancements

Fix series query (filter by field type)
Add downsampling (1m, 1h buckets)
Implement rate limiting per device
Add WebSocket for real-time updates
Unit tests (Jest + Supertest)


🗺️ Roadmap
✅ Phase 1.1 - Backend Base (COMPLETE)

 Express setup
 PostgreSQL, InfluxDB, MQTT connections
 Logging (Pino)
 Health check

✅ Phase 1.2 - Database & Auth (COMPLETE)

 Schema PostgreSQL
 Migrations
 JWT auth
 Multi-tenancy

✅ Phase 1.3 - Device Management (COMPLETE)

 CRUD devices
 Device provisioning
 Auto-discovery

✅ Phase 1.4 - Device API REST (COMPLETE)

 GET /devices
 GET /devices/:id
 DELETE /devices/:id

✅ Phase 1.5 - Telemetry API (COMPLETE)

 MQTT listener telemetria
 Buffer + batch write InfluxDB
 Cache device_uuid
 APIs: latest, series, metrics
 Validation (Zod)

🔄 Phase 1.6 - Enhancements (NEXT)

 Fix series query (filter by field)
 Downsampling (InfluxDB tasks)
 Rate limiting per device
 WebSocket real-time
 Unit tests

📋 Phase 2.1 - Frontend Base

 Setup React + Vite + TypeScript
 Authentication pages
 Dashboard layout
 Device list
 Real-time charts

📋 Phase 2.2 - ESPHome Integration

 ESPHome config generator
 Firmware OTA updates
 Device templates UI
 WiFi provisioning

🚀 Phase 3.1 - Production Ready

 Docker multi-stage builds
 CI/CD (GitHub Actions)
 Monitoring (Prometheus + Grafana)
 Backup automation
 API documentation (Swagger)

🌟 Phase 3.2 - Advanced Features

 Webhooks
 Home Assistant integration
 Mobile app (React Native)
 Rules engine (automations)
 Marketplace


🐛 Troubleshooting
Backend não inicia
bash# Verificar logs
cd ~/easysmart-platform/backend
npm run dev

# Verificar portas
netstat -tulpn | grep -E '3010|5432|8086|1883'

# Verificar Docker
cd ~/docker
docker compose ps
Database "easysmart" does not exist
bashdocker exec -it postgres psql -U postgres -c "CREATE DATABASE easysmart;"
MQTT não conecta
bash# Logs
docker logs mosquitto --tail 50

# Testar
docker exec mosquitto mosquitto_pub \
  -h localhost -u devices -P 'senha' \
  -t 'test' -m 'hello'

# Verificar credenciais
grep MQTT_PASSWORD ~/docker/.env
InfluxDB não conecta
bash# Logs
docker logs influxdb --tail 50

# Verificar token
docker exec influxdb influx auth list

# Testar
curl -I http://localhost:8086/health
Telemetria não aparece no InfluxDB
bash# 1. Verificar logs do backend (telemetria enfileirada?)
# 2. Verificar métricas do writer
curl -s "http://localhost:3010/api/v1/telemetry/metrics" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Query direto no InfluxDB
docker exec influxdb influx query \
  'from(bucket:"iot_data") |> range(start:-1h) |> filter(fn:(r) => r._measurement == "telemetry")'
Query series retorna erro "unsupported input type"
Causa: Query pegando múltiplos field types (float + bool)
Solução: Filtrar field específico:
bash# Para sensores numéricos, adicionar na query:
?start=-1h&field=value_float

# Implementar no código (pendente Phase 1.6)
Port 3001 vs 3010
Backend roda na porta 3010 por padrão. Verificar .env:
bashgrep PORT backend/.env
# Deve mostrar: PORT=3010
Limpar e reconstruir
bash# CUIDADO: Apaga dados!
cd ~/docker
docker compose down -v
docker compose up -d

# Recriar banco
docker exec -it postgres psql -U postgres -c "CREATE DATABASE easysmart;"

# Rodar migrations
cd ~/easysmart-platform/backend
npm run migrate:up

# Reiniciar
npm run dev

📊 Métricas e Monitoramento
Health Check
bashcurl http://localhost:3010/health | jq
Response:
json{
  "status": "ok",
  "services": {
    "postgres": true,
    "influxdb": true,
    "mqtt": true
  },
  "influxWriter": {
    "pointsWritten": 1523,
    "pointsDropped": 0,
    "writeErrors": 0,
    "queueSize": 0,
    "cacheSize": 15
  }
}
Logs Estruturados (Pino)
Development: Pretty-printed colorido
Production: JSON (parse com tools como ELK, Grafana Loki)
bash# Ver logs em tempo real
cd ~/easysmart-platform/backend
npm run dev

# Filtrar por nível
npm run dev 2>&1 | grep ERROR
```

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👥 Autor

**Rodrigo S. Lange**
- GitHub: [@rodrigo-s-lange](https://github.com/rodrigo-s-lange)
- Email: rodrigo@easysmart.io

---

## 🙏 Agradecimentos

### Tecnologias
- [ESPHome](https://esphome.io/) - Framework ESP32/ESP8266
- [Express.js](https://expressjs.com/) - Web framework Node.js
- [InfluxDB](https://www.influxdata.com/) - Time-series database
- [Eclipse Mosquitto](https://mosquitto.org/) - MQTT broker
- [Pino](https://getpino.io/) - Fast logger

### AI Collaboration
Este projeto foi desenvolvido em colaboração entre:
- **Humano:** Rodrigo S. Lange (arquitetura, decisões, testes)
- **Claude (Anthropic):** Implementação Phase 1.1-1.5
- **ChatGPT (OpenAI):** Revisões e melhorias

O trabalho conjunto entre LLMs está acelerando o desenvolvimento de software de forma incrível! 🚀

---

**Last Updated:** 2025-10-16  
**Version:** 0.2.0  
**Status:** Phase 1.5 Complete ✅  
**Production Ready:** 🟡 MVP Ready

---

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/rodrigo-s-lange/easysmart-platform/issues)
- **Discussions:** [GitHub Discussions](https://github.com/rodrigo-s-lange/easysmart-platform/discussions)
- **Email:** rodrigo@easysmart.io

---

**Built with ❤️ by humans and AI working together**