# 🚀 EasySmart IoT Platform

> **Enterprise-grade Multi-tenant IoT Platform with ESPHome Integration**

Modern, scalable IoT platform built for industrial applications with real-time telemetry, device management, and multi-tenancy support.

[![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://github.com/rodrigo-s-lange/easysmart-platform)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22.20.0-brightgreen.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.10-blue.svg)](https://www.postgresql.org)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Device Integration](#device-integration)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**EasySmart** is a production-ready IoT platform designed for industrial applications, focusing on:

- 🏢 **Multi-tenancy**: Complete data isolation between tenants
- 🔐 **Enterprise Security**: JWT auth, RBAC, rate limiting, audit logs
- 📡 **Real-time Telemetry**: MQTT + InfluxDB for time-series data
- 🎛️ **ESPHome Integration**: First-class support for ESP32 devices
- 📊 **Admin Dashboard**: Cross-tenant management and metrics
- 🔄 **Auto-discovery**: Zero-config device provisioning

---

## ✨ Features

### Core Features

✅ **Multi-tenant Architecture**
- Complete data isolation (row-level security)
- Tenant-specific user management
- Cross-tenant admin panel for platform operators

✅ **Authentication & Authorization**
- JWT-based authentication (access + refresh tokens)
- Role-Based Access Control (RBAC)
  - `super_admin`: Platform administrator
  - `tenant_admin`: Tenant administrator
  - `user`: Regular user
- Token refresh mechanism
- Secure password hashing (bcrypt)

✅ **Rate Limiting & Security**
- Login: 5 attempts / 15min
- Register: 3 attempts / hour
- API: 100 requests / 15min
- Admin: 200 requests / 15min
- Brute force protection

✅ **Audit Logging**
- All critical actions logged
- Compliance-ready (LGPD/GDPR)
- IP address and user agent tracking
- Login/logout tracking
- Failed authentication attempts
- 9 optimized indexes for fast queries

✅ **Device Management**
- MQTT auto-discovery (ESPHome compatible)
- Device provisioning with tokens
- Real-time status tracking
- Entity management (sensors, switches, binary sensors)
- Metadata storage (JSON)

✅ **Telemetry System**
- Time-series data storage (InfluxDB)
- Real-time data ingestion via MQTT
- Support for multiple value types (float, bool, string)
- Aggregation and querying
- Device caching for performance

✅ **Admin Panel API**
- Cross-tenant device listing
- Platform metrics and statistics
- Tenant management
- User impersonation (for support)
- Audit log viewing

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                       EASYSMART PLATFORM                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │   Devices    │  │
│  │  React 18    │──▶ │   Node 22    │◀──│   ESP32      │  │
│  │  Vite + TS   │    │   Express    │    │   ESPHome    │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                              │                             │
│                    ┌─────────┼─────────┐                   │
│                    │         │         │                   │
│              ┌─────▼───┐ ┌──▼────┐ ┌──▼────┐               │
│              │PostgreSQL│ │InfluxDB│ │ MQTT  │             │
│              │  Users   │ │Telemetry│ │Broker │            │
│              │  Devices │ │Time-series││Mosquitto│         │
│              └──────────┘ └────────┘ └───────┘             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Data Flow

```
ESP32 Device
    │
    │ (MQTT Discovery)
    ▼
Mosquitto Broker
    │
    │ (Subscribe)
    ▼
Backend MQTT Service
    │
    ├─▶ PostgreSQL (Device metadata, entities)
    │
    └─▶ InfluxDB (Telemetry time-series)
```

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 22.20.0
- **Framework**: Express 4.x
- **Database**: PostgreSQL 16.10 (users, devices, entities)
- **Time-series**: InfluxDB 2.x (telemetry data)
- **Message Broker**: Mosquitto MQTT 2.x
- **Authentication**: JWT (jsonwebtoken)
- **Logging**: Pino (structured logs)
- **Validation**: Express validators
- **Security**: Helmet, bcrypt, rate limiting

### Frontend
- **Framework**: React 18
- **Build**: Vite
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **HTTP**: Axios + React Query

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (production)
- **Process Manager**: PM2 (production)
- **Monitoring**: Portainer CE

### Device Firmware
- **Platform**: ESPHome 2025.10.2
- **Hardware**: ESP32, ESP32-S3
- **Protocol**: MQTT

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22.20.0+ ([Download](https://nodejs.org))
- **Docker** & **Docker Compose** ([Download](https://docs.docker.com/get-docker/))
- **Git** ([Download](https://git-scm.com/downloads))

### Quick Start

#### 1. Clone Repository

```bash
git clone https://github.com/rodrigo-s-lange/easysmart-platform.git
cd easysmart-platform
```

#### 2. Start Infrastructure

```bash
cd ~/docker
docker-compose up -d

# Verify services
docker ps
```

**Services running:**
- PostgreSQL: `localhost:5432`
- InfluxDB: `localhost:8086`
- Mosquitto: `localhost:1883`
- ESPHome: `localhost:6052`

#### 3. Setup Backend

```bash
cd ~/easysmart-platform/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Run migrations
npm run migrate:up

# Start development server
npm run dev
```

**Backend running:** `http://localhost:3010`

#### 4. Setup Frontend

```bash
cd ~/easysmart-platform/frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

**Frontend running:** `http://localhost:5173`

#### 5. Create Super Admin

```bash
# Login to PostgreSQL
docker exec -it postgres psql -U postgres -d easysmart

# Create admin user
INSERT INTO tenants (name) VALUES ('EasySmart Platform');

INSERT INTO users (tenant_id, email, password_hash, role) 
SELECT 
  id,
  'admin@easysmart.io',
  '$2b$10$...',  -- Use bcrypt to hash 'admin123456'
  'super_admin'
FROM tenants WHERE name = 'EasySmart Platform';
```

**Login:** `admin@easysmart.io` / `admin123456`

---

## 📁 Project Structure

```
easysmart-platform/
├── backend/
│   ├── src/
│   │   ├── config/           # Database, InfluxDB, Logger
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, RBAC, Rate limiting
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic (MQTT, Influx)
│   │   ├── utils/            # Helpers, Token, Audit logger
│   │   └── server.js         # Entry point
│   ├── migrations/           # Database migrations
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # API clients, utils
│   │   ├── stores/           # Zustand stores
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   └── .env
├── docker/                   # Infrastructure
│   └── docker-compose.yml
├── docs/                     # Documentation
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## 📖 API Documentation

### Base URL

```
http://localhost:3010/api/v1
```

### Authentication

All protected endpoints require JWT token in header:

```
Authorization: Bearer <access_token>
```

---

### 🔐 Auth Endpoints

#### `POST /auth/register`

Register new tenant + admin user.

**Rate limit:** 3 requests/hour

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "tenant_name": "My Company"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "tenant_id": "uuid",
    "role": "tenant_admin"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "rt_abc..."
  }
}
```

---

#### `POST /auth/login`

Authenticate user.

**Rate limit:** 5 attempts/15min

**Request:**
```json
{
  "email": "admin@easysmart.io",
  "password": "admin123456"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@easysmart.io",
    "tenant_id": "uuid",
    "role": "super_admin"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "rt_abc..."
  }
}
```

---

#### `POST /auth/refresh`

Refresh access token.

**Request:**
```json
{
  "refreshToken": "rt_abc..."
}
```

**Response:**
```json
{
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "rt_def..."
  }
}
```

---

#### `POST /auth/logout`

Logout user (invalidate refresh token).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "refreshToken": "rt_abc..."
}
```

**Response:**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

#### `GET /auth/users/me`

Get current user info.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@easysmart.io",
    "tenant_id": "uuid",
    "role": "super_admin",
    "created_at": "2025-10-16T22:31:00.102Z"
  }
}
```

---

### 📱 Device Endpoints

#### `GET /devices`

List devices (tenant-scoped).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "ESP32S3 Lab Sensor",
    "status": "online",
    "device_token": "easysmrt_dev_...",
    "metadata": {
      "id": "esp32s3-lab",
      "model": "ESP32-S3",
      "manufacturer": "Espressif"
    },
    "last_seen": "2025-10-23T14:25:52.048Z",
    "created_at": "2025-10-23T00:14:53.201Z"
  }
]
```

---

#### `POST /devices/provision`

Manually provision device.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Office Sensor",
  "metadata": {
    "location": "Office Room 1",
    "type": "temperature"
  }
}
```

**Response:**
```json
{
  "device": {
    "id": "uuid",
    "name": "Office Sensor",
    "device_token": "easysmrt_dev_abc123...",
    "status": "offline"
  }
}
```

---

#### `GET /devices/:id`

Get device details + entities.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "device": {
    "id": "uuid",
    "name": "ESP32S3 Lab Sensor",
    "status": "online",
    "metadata": { ... },
    "last_seen": "2025-10-23T14:25:52.048Z"
  },
  "entities": [
    {
      "id": "uuid",
      "entity_id": "temperature",
      "entity_type": "sensor",
      "name": "Temperature",
      "unit": "°C",
      "device_class": "temperature"
    }
  ]
}
```

---

### 🔧 Admin Endpoints

**Requires:** `role: super_admin`

---

#### `GET /admin/tenants`

List all tenants.

**Query params:**
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "tenants": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "created_at": "2025-10-17T11:23:59.199Z",
      "user_count": "5",
      "device_count": "12",
      "status": "active"
    }
  ],
  "total": 10,
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

---

#### `GET /admin/tenants/:id`

Get tenant details.

**Response:**
```json
{
  "tenant": {
    "id": "uuid",
    "name": "Acme Corp",
    "created_at": "2025-10-17T11:23:59.199Z"
  },
  "users": [...],
  "devices": [...],
  "stats": {
    "total_users": 5,
    "total_devices": 12,
    "online_devices": 10
  }
}
```

---

#### `GET /admin/devices`

List all devices (cross-tenant).

**Query params:**
- `status` (online/offline)
- `tenant_id` (filter by tenant)
- `limit`, `offset`

**Response:**
```json
{
  "devices": [
    {
      "id": "uuid",
      "name": "ESP32S3 Lab Sensor",
      "status": "online",
      "tenant_id": "uuid",
      "tenant_name": "Acme Corp",
      "entity_count": "3"
    }
  ],
  "pagination": {
    "total": 55,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### `GET /admin/metrics`

Platform-wide metrics.

**Response:**
```json
{
  "platform": {
    "total_tenants": 4,
    "new_tenants_30d": 4,
    "total_users": 10,
    "new_users_30d": 8,
    "total_devices": 55,
    "online_devices": 53,
    "new_devices_30d": 55,
    "active_devices_24h": 28
  },
  "system": {
    "uptime": 86400,
    "version": "0.4.0"
  }
}
```

---

#### `POST /admin/tenants/:id/impersonate`

Impersonate tenant (for support).

**Request:**
```json
{
  "reason": "Customer requested support for device XYZ"
}
```

**Response:**
```json
{
  "message": "Impersonate realizado com sucesso",
  "target_tenant": {
    "id": "uuid",
    "name": "Acme Corp"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "rt_..."
  }
}
```

**Audit:** All impersonate actions are logged in `audit_logs` table.

---

### 📊 Telemetry Endpoints

#### `GET /telemetry/:deviceId/:entityId/latest`

Get latest value.

**Response:**
```json
{
  "deviceId": "uuid",
  "entityId": "temperature",
  "value": 27.1,
  "unit": "°C",
  "timestamp": "2025-10-23T17:27:18.053Z"
}
```

---

#### `GET /telemetry/:deviceId/:entityId/series`

Get time-series data.

**Query params:**
- `start` (default: -6h)
- `stop` (default: now())
- `window` (default: 1m)
- `aggregation` (mean/min/max/count)

**Response:**
```json
{
  "series": [
    {
      "timestamp": "2025-10-23T17:00:00Z",
      "value": 26.5
    },
    {
      "timestamp": "2025-10-23T17:01:00Z",
      "value": 26.8
    }
  ]
}
```

---

## 🔒 Security

### Authentication Flow

```
User Login
    │
    ├─▶ Validate credentials
    │
    ├─▶ Generate Access Token (15min expiry)
    │
    ├─▶ Generate Refresh Token (7 days expiry)
    │
    └─▶ Return tokens

Access Token Expired
    │
    ├─▶ Use Refresh Token
    │
    ├─▶ Validate Refresh Token
    │
    ├─▶ Generate new Access + Refresh Tokens
    │
    └─▶ Return new tokens
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 5 requests | 15 minutes |
| `/auth/register` | 3 requests | 1 hour |
| `/api/v1/*` | 100 requests | 15 minutes |
| `/admin/*` | 200 requests | 15 minutes |

### Audit Logging

All critical actions are logged in `audit_logs` table:

| Event Type | Description |
|------------|-------------|
| `auth.login` | Successful login |
| `auth.login_failed` | Failed login attempt |
| `auth.logout` | User logout |
| `admin.impersonate_start` | Admin impersonation |
| `device.created` | Device provisioned |
| `device.deleted` | Device deleted |
| `security.access_denied` | Unauthorized access attempt |

**Query audit logs:**
```sql
SELECT event_type, action, success, ip_address, created_at 
FROM audit_logs 
WHERE user_id = '<uuid>' 
ORDER BY created_at DESC 
LIMIT 100;
```

### Password Security

- **Hashing:** bcrypt with 10 rounds
- **Min length:** 6 characters
- **Stored:** Only hash stored, never plain text

### RBAC (Role-Based Access Control)

| Role | Permissions |
|------|-------------|
| `super_admin` | Full platform access, cross-tenant operations |
| `tenant_admin` | Manage tenant users and devices |
| `user` | View own data, manage own devices |

---

## 📡 Device Integration

### ESPHome Configuration

**Example: ESP32-S3 with Temperature Sensor**

```yaml
esphome:
  name: esp32s3-lab
  friendly_name: "ESP32S3 Lab Sensor"
  project:
    name: "easysmart.lab"
    version: "1.0"
  
  on_boot:
    priority: -10
    then:
      - mqtt.publish:
          topic: easysmart/esp32s3-lab/discovery
          payload: |-
            {
              "device": {
                "id": "esp32s3-lab",
                "name": "ESP32S3 Lab Sensor",
                "model": "ESP32-S3",
                "manufacturer": "Espressif",
                "sw_version": "ESPHOME"
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
                  "type": "binary_sensor",
                  "id": "button",
                  "name": "Button"
                },
                {
                  "type": "switch",
                  "id": "led",
                  "name": "Status LED"
                }
              ]
            }
          retain: true
          qos: 1

esp32:
  variant: esp32s3
  framework:
    type: esp-idf

logger:
api:
ota: 
  - platform: esphome

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

mqtt:
  broker: 192.168.0.100  # Your server IP
  username: devices
  password: !secret mqtt_password
  topic_prefix: easysmart/esp32s3-lab
  discovery: false
  birth_message:
    topic: easysmart/esp32s3-lab/availability
    payload: "online"
    retain: true
  will_message:
    topic: easysmart/esp32s3-lab/availability
    payload: "offline"
    retain: true

# Sensor DS18B20
one_wire:
  - platform: gpio
    pin: GPIO10

sensor:
  - platform: dallas_temp
    name: "Temperature"
    id: temperature
    address: 0x290315A279358B28
    update_interval: 30s
    unit_of_measurement: "°C"
    device_class: temperature
    filters:
      - median

# Button GPIO12
binary_sensor:
  - platform: gpio
    id: button
    name: "Button"
    pin:
      number: GPIO12
      mode:
        input: true
        pullup: true

# LED GPIO11
output:
  - platform: gpio
    id: led_out
    pin: GPIO11

switch:
  - platform: output
    id: led
    name: "Status LED"
    output: led_out
```

### MQTT Topics

**Discovery (device sends once on boot):**
```
easysmart/{device_id}/discovery
```

**Telemetry (device sends periodically):**
```
easysmart/{device_id}/sensor/{entity_id}/state
easysmart/{device_id}/switch/{entity_id}/state
easysmart/{device_id}/binary_sensor/{entity_id}/state
```

**Availability:**
```
easysmart/{device_id}/availability
```

### Discovery Payload Format

```json
{
  "device": {
    "id": "unique-device-id",
    "name": "Device Name",
    "model": "ESP32-S3",
    "manufacturer": "Espressif",
    "sw_version": "1.0.0"
  },
  "entities": [
    {
      "type": "sensor|switch|binary_sensor",
      "id": "entity_id",
      "name": "Entity Name",
      "unit": "°C",
      "device_class": "temperature"
    }
  ]
}
```

---

## 🔧 Development

### Prerequisites

- Node.js 22.20.0+
- Docker & Docker Compose
- Git

### Local Development

```bash
# Backend
cd backend
npm run dev  # Auto-restart on changes

# Frontend
cd frontend
npm run dev  # Hot reload enabled
```

### Database Migrations

```bash
# Create new migration
npm run migrate:create <migration-name>

# Run migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down
```

### Useful Commands

```bash
# View backend logs
cd backend && npm run dev

# View PostgreSQL
docker exec -it postgres psql -U postgres -d easysmart

# View InfluxDB data
docker exec -it influxdb influx query \
  'from(bucket: "iot_data") 
    |> range(start: -1h) 
    |> filter(fn: (r) => r._measurement == "telemetry")'

# View MQTT messages
docker exec -it mosquitto mosquitto_sub -t 'easysmart/#' -v

# Restart services
docker-compose restart
```

---

## 🚀 Production Deployment

### Docker Production Setup

**1. Update docker-compose.prod.yml**

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - PORT=3010
    restart: always
    
  frontend:
    build: ./frontend
    restart: always
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    restart: always
```

**2. SSL/TLS Setup**

```bash
# Generate SSL certificate (Let's Encrypt)
certbot certonly --standalone -d yourdomain.com
```

**3. Environment Variables**

```bash
# Production .env
NODE_ENV=production
JWT_SECRET=<strong-random-secret-256-bit>
POSTGRES_PASSWORD=<strong-password>
INFLUXDB_TOKEN=<strong-token>
MQTT_PASSWORD=<strong-password>
```

**4. Deploy**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### PM2 Production (Alternative)

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start src/server.js --name easysmart-backend

# Start frontend build
cd frontend
npm run build
pm2 serve dist 5173 --name easysmart-frontend

# Save PM2 config
pm2 save
pm2 startup
```

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Multi-tenant architecture
- [x] PostgreSQL schema
- [x] InfluxDB integration
- [x] MQTT service
- [x] Basic CRUD APIs

### ✅ Phase 2: Security & Admin (COMPLETE)
- [x] JWT authentication
- [x] RBAC system
- [x] Admin panel backend
- [x] Rate limiting
- [x] Audit logging
- [x] Device real integration (ESP32-S3)

### 🚧 Phase 3: Dashboard & UX (IN PROGRESS)
- [ ] Real-time WebSocket
- [ ] Device management UI
- [ ] Telemetry charts (Recharts)
- [ ] Admin dashboard UI
- [ ] Responsive design

### 📅 Phase 4: Advanced Features (PLANNED)
- [ ] Rule engine (automations)
- [ ] Notifications (Telegram, Email)
- [ ] OTA updates via MQTT
- [ ] Firmware builder (ESPHome)
- [ ] Multi-language support

### 📅 Phase 5: Enterprise (FUTURE)
- [ ] Billing & subscriptions
- [ ] White-label support
- [ ] Advanced analytics
- [ ] Edge gateway
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/rodrigo-s-lange/easysmart-platform/issues)
- **Email:** rodrigo.s.lange@gmail.com
- **Documentation:** [Project Wiki](https://github.com/rodrigo-s-lange/easysmart-platform/wiki)

---

## 🙏 Acknowledgments

- [ESPHome](https://esphome.io/) - Excellent firmware framework
- [InfluxDB](https://www.influxdata.com/) - Time-series database
- [Eclipse Mosquitto](https://mosquitto.org/) - MQTT broker
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

---

## 📊 Project Stats

- **Version:** 0.4.0
- **Backend Lines:** ~3,500
- **Frontend Lines:** ~2,000
- **Test Coverage:** Coming soon
- **Documentation:** 100%
- **Device Support:** ESP32, ESP32-S3, ESP32-C3, ESP32-C6, (ESPHome), STM32(coming soon)

---

## 🎯 Built With ❤️ by Rodrigo S. Lange

**EasySmart Platform** - Making IoT simple, secure, and scalable.

---

**⭐ Star this repo if you find it useful!**

[🔝 Back to top](#-easysmart-iot-platform)