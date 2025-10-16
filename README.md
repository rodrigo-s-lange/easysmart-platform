# 🏭 EasySmart IoT Platform

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20.x-green)
![Docker](https://img.shields.io/badge/docker-compose-blue)
![Status](https://img.shields.io/badge/status-in%20development-yellow)

> **Multi-tenant SaaS IoT platform** para monitoramento e controle de dispositivos ESP32/ESP8266 com arquitetura híbrida de bancos de dados.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#️-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura de Diretórios](#-estrutura-de-diretórios)
- [Quick Start](#-quick-start)
- [Configuração](#-configuração)
- [Testes de Conectividade](#-testes-de-conectividade)
- [MQTT Topics](#-mqtt-topics)
- [Diretrizes para IA](#-diretrizes-para-ia)
- [Segurança](#-segurança)
- [Roadmap](#️-roadmap)

---

## 🎯 Visão Geral

EasySmart é uma plataforma IoT multi-tenant que permite a indivíduos e pequenas empresas:

- 📱 Monitorar sensores em tempo real
- 🎛️ Controlar atuadores remotamente
- 📊 Visualizar histórico de dados (30 dias)
- 🔐 Autenticação segura com JWT
- 🌐 Comunicação via MQTT

### Público-Alvo

- **Hobbyists**: Entusiastas de smart home
- **Pequenas Empresas**: Monitoramento de equipamentos
- **Integradores**: Soluções customizadas para clientes

---

## 🏗️ Arquitetura

### Dual Database Strategy
```
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                       │
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Device     │         │    Data      │             │
│  │   Service    │         │   Service    │             │
│  └──────┬───────┘         └──────┬───────┘             │
│         │                        │                      │
└─────────┼────────────────────────┼──────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────┐      ┌──────────────────────┐
│   PostgreSQL    │      │     InfluxDB         │
│   (Relational)  │      │   (Time-Series)      │
├─────────────────┤      ├──────────────────────┤
│ • Users         │      │ • sensor_readings    │
│ • Tenants       │      │ • entity_states      │
│ • Devices       │      │ • telemetry_data     │
│ • Entities      │      │ • 30d retention      │
└─────────────────┘      └──────────────────────┘
          ▲                        ▲
          │                        │
          └────────┬───────────────┘
                   │
          ┌────────▼────────┐
          │   Mosquitto     │
          │   MQTT Broker   │
          │  Port 1883/9001 │
          └─────────────────┘
                   ▲
                   │
          ┌────────┴────────┐
          │   ESP32/ESP8266 │
          │   IoT Devices   │
          └─────────────────┘
```

### Responsabilidades

| Database   | Responsabilidade                          |
|------------|-------------------------------------------|
| PostgreSQL | Metadata, Users, Tenants, Config          |
| InfluxDB   | Time-series data, Sensor readings         |
| Mosquitto  | Device ↔ Backend real-time communication |

---

## 🛠️ Stack Tecnológica

### Backend
- **Runtime**: Node.js 20.x LTS
- **Framework**: Express.js
- **Database**: PostgreSQL 16 (relational) + InfluxDB 2.7 (time-series)
- **MQTT Broker**: Eclipse Mosquitto 2.0
- **Auth**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting

### Frontend (Planejado)
- **Framework**: React 18
- **State Management**: Context API / Zustand
- **UI Library**: TailwindCSS + shadcn/ui
- **Charts**: Recharts / Chart.js

### Infrastructure
- **OS**: Ubuntu 24.04 LTS Server
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Cloudflare Tunnel
- **Domain**: easysmart.com.br

---

## 📁 Estrutura de Diretórios
```
~/docker/iot/
├── docker-compose.yml        # Orchestration file
├── .env                      # Environment variables (gitignored)
├── .env.example              # Template for .env
├── README.md                 # This file
├── CHANGELOG.md              # Version history
│
├── server/                   # Backend API (Node.js)
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── config/
│       │   ├── database.js   # PostgreSQL connection
│       │   ├── influxdb.js   # InfluxDB client
│       │   └── mqtt.js       # MQTT client
│       ├── models/
│       │   ├── User.js
│       │   ├── Tenant.js
│       │   ├── Device.js
│       │   └── Entity.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── deviceController.js
│       │   └── healthController.js
│       ├── routes/
│       │   ├── index.js
│       │   ├── auth.js
│       │   └── devices.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── rateLimiter.js
│       └── server.js         # Entry point
│
├── frontend/                 # React App (TODO)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── postgres/                 # PostgreSQL data
│   └── data/                 # (gitignored)
│
├── influxdb/                 # InfluxDB data
│   ├── data/                 # (gitignored)
│   └── config/               # (gitignored)
│
└── mosquitto/                # Mosquitto config
    ├── config/
    │   ├── mosquitto.conf
    │   └── passwd            # (gitignored)
    ├── data/                 # (gitignored)
    └── log/                  # (gitignored)
```

---

## 🚀 Quick Start

### Pré-requisitos

- Docker 24.x+ & Docker Compose 2.x+
- Git
- Node.js 20.x (opcional, para dev local)

### 1️⃣ Clone do Repositório
```bash
git clone https://github.com/rodrigo-s-lange/easysmart-platform.git
cd easysmart-platform
```

### 2️⃣ Configurar Variáveis de Ambiente
```bash
cp .env.example .env
nano .env
```

**Defina senhas fortes para todas as variáveis.**

### 3️⃣ Subir Stack Docker
```bash
docker compose up -d
```

### 4️⃣ Verificar Status
```bash
docker compose ps
```

**Output esperado:**
```
NAME                  STATUS
postgres-easysmart    Up (healthy)
influxdb-easysmart    Up (healthy)
mosquitto-easysmart   Up (healthy)
easysmart-server      Up
```

### 5️⃣ Testar Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Database check
curl http://localhost:3000/db-check
```

---

## 🔧 Configuração

### Arquivo .env
```env
# PostgreSQL
POSTGRES_USER=easysmart
POSTGRES_PASSWORD=****************
POSTGRES_DB=easysmart

# InfluxDB
INFLUXDB_ADMIN_USER=admin
INFLUXDB_ADMIN_PASSWORD=****************
INFLUXDB_ORG=easysmart
INFLUXDB_BUCKET=iot_data
INFLUXDB_ADMIN_TOKEN=****************

# Mosquitto
MQTT_USERNAME=devices
MQTT_PASSWORD=****************

# Backend
JWT_SECRET=****************
NODE_ENV=development
PORT=3000
```

### Gerar Senhas Fortes
```bash
# Password (24 caracteres)
openssl rand -base64 24

# Token (64 caracteres hex)
openssl rand -hex 32
```

### Configurar Senha do Mosquitto
```bash
# Criar arquivo de senha
docker run --rm -v $(pwd)/mosquitto/config:/mosquitto/config \
  eclipse-mosquitto:2.0 mosquitto_passwd -b /mosquitto/config/passwd devices 'SUA_SENHA_AQUI'

# Ajustar permissões
chmod 0600 mosquitto/config/passwd
```

---

## 🧪 Testes de Conectividade

### PostgreSQL
```bash
docker exec postgres-easysmart psql -U easysmart -d easysmart -c "SELECT version();"
```

### InfluxDB
```bash
curl -s http://localhost:8086/health | jq
```

### Mosquitto (MQTT)
```bash
# Publicar
docker exec mosquitto-easysmart mosquitto_pub \
  -h localhost -p 1883 -u devices -P 'SUA_SENHA' \
  -t 'test/topic' -m 'Hello MQTT'

# Subscrever (em outro terminal)
docker exec mosquitto-easysmart mosquitto_sub \
  -h localhost -p 1883 -u devices -P 'SUA_SENHA' \
  -t 'test/#' -v
```

### Backend API
```bash
# Health check
curl http://localhost:3000/health

# Database check
curl http://localhost:3000/db-check
```

---

## 📡 MQTT Topics

### Estrutura de Topics
```
devices/{DEVICE_ID}/status                    # LWT: online/offline
devices/{DEVICE_ID}/discovery                 # Auto-discovery payload
devices/{DEVICE_ID}/{ENTITY_ID}/state         # Sensor readings
devices/{DEVICE_ID}/{ENTITY_ID}/set           # Control commands
devices/{DEVICE_ID}/telemetry                 # Batch telemetry
```

### Exemplos
```bash
# Device status (Last Will Testament)
devices/ESP32_001/status → "online"

# Sensor reading
devices/ESP32_001/temp_oil/state → {"value": 85.5, "unit": "°C"}

# Switch control
devices/ESP32_001/relay_main/set → {"state": "on"}

# Discovery payload
devices/ESP32_001/discovery → {
  "device_id": "ESP32_001",
  "entities": [
    {"id": "temp_oil", "type": "sensor", "unit": "°C"},
    {"id": "relay_main", "type": "switch"}
  ]
}
```

---

## 🤖 Diretrizes para IA

### Seu Papel

Você é uma **consultora sênior** especializada em:
- Node.js backend development
- Multi-tenant SaaS architecture
- IoT systems (MQTT, ESP32/ESP8266)
- PostgreSQL + InfluxDB dual database strategy
- Docker & Linux server administration

### Regras de Comunicação

#### ✅ SEMPRE FAZER

1. **Perguntar antes de executar**
   - Contextualizar necessidade
   - Confirmar antes de comandos destrutivos
   - Validar entendimento

2. **Organizar código em arquivos apropriados**
```javascript
   // ✅ CORRETO - Arquivo separado
   // services/mqttService.js
   const mqtt = require('mqtt');
   class MqttService { ... }
   module.exports = new MqttService();
```

3. **Fornecer código completo e funcional**
   - Sem placeholders
   - Com imports necessários
   - Com tratamento de erros

4. **Sugerir commits Git em momentos estratégicos**
```bash
   git add config/database.js
   git commit -m "feat: add PostgreSQL connection module"
```

5. **Incluir validação e testes**
```bash
   # Testar se funciona
   curl http://localhost:3000/health
```

#### ❌ NUNCA FAZER

1. Assumir conhecimento avançado de Linux
2. Comandos incompletos ou genéricos
3. Criar arquivos gigantes monolíticos (max 300 linhas)
4. Esquecer de mencionar .gitignore
5. Pular etapas de teste

### Convenções de Commits

Use **Conventional Commits**:
```bash
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Apenas documentação
refactor: Refatoração sem adicionar features
test:     Adicionar/corrigir testes
chore:    Manutenção, build, configs
```

**Exemplos:**
```bash
git commit -m "feat: add JWT authentication"
git commit -m "fix: resolve MQTT connection timeout"
git commit -m "docs: update README with MQTT topics"
```

### Workflow de Desenvolvimento

1. **Planejamento** → Definir arquitetura
2. **Setup Inicial** → `.gitignore`, `package.json`, `Dockerfile`
3. **Desenvolvimento Incremental** → 1 componente por vez
4. **Integração** → Testes end-to-end
5. **Deploy** → Build Docker, produção

---

## 🔐 Segurança

### Implementado

- ✅ Senhas hashadas com bcrypt
- ✅ JWT com expiração
- ✅ Helmet (security headers)
- ✅ CORS configurado
- ✅ Prepared statements (SQL injection prevention)
- ✅ Senha do MQTT com hash
- ✅ `.env` não commitado

### Planejado

- [ ] Rate limiting (login attempts)
- [ ] Refresh tokens
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Audit logs

### Checklist de Segurança

- [ ] Senhas com min 16 caracteres
- [ ] JWT secret com min 32 caracteres
- [ ] HTTPS em produção (Cloudflare Tunnel)
- [ ] Firewall configurado (UFW)
- [ ] Backups automáticos
- [ ] Logs de acesso

---

## 🗺️ Roadmap

### ✅ Phase 0: Infraestrutura (COMPLETO)
- Docker Compose stack
- PostgreSQL + InfluxDB + Mosquitto
- Backend skeleton
- Health check endpoint

### 🚧 Phase 1: Backend API (EM ANDAMENTO)
- [ ] Database models (User, Tenant, Device, Entity)
- [ ] Authentication (register/login)
- [ ] Device CRUD endpoints
- [ ] MQTT integration
- [ ] InfluxDB telemetry storage

### 📋 Phase 2: Frontend (PLANEJADO)
- [ ] React app setup
- [ ] Login/Register pages
- [ ] Dashboard com device cards
- [ ] Real-time updates (WebSocket)
- [ ] Charts (histórico de dados)

### 📋 Phase 3: Features Avançadas
- [ ] Multi-tenancy enforcement
- [ ] Plan limits (Free/Starter/Pro)
- [ ] Billing integration
- [ ] Email notifications
- [ ] Admin panel

### 📋 Phase 4: ESP32 Integration
- [ ] ESPHome YAML templates
- [ ] Auto-discovery protocol
- [ ] OTA updates
- [ ] Device provisioning flow

---

## 📚 Recursos Adicionais

- **Documentação Oficial**
  - [Node.js](https://nodejs.org/docs/)
  - [Express.js](https://expressjs.com/)
  - [PostgreSQL](https://www.postgresql.org/docs/)
  - [InfluxDB](https://docs.influxdata.com/)
  - [Mosquitto](https://mosquitto.org/documentation/)
  - [Docker](https://docs.docker.com/)

- **Repositório**
  - [GitHub - easysmart-platform](https://github.com/rodrigo-s-lange/easysmart-platform)

- **Issues & Discussions**
  - [GitHub Issues](https://github.com/rodrigo-s-lange/easysmart-platform/issues)

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
