# 🏠 EasySmart IoT Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.19.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![InfluxDB](https://img.shields.io/badge/InfluxDB-2.x-blue)](https://www.influxdata.com/)

> Plataforma SaaS multi-tenant para gerenciamento de dispositivos IoT usando ESP32/ESP8266 com ESPHome

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Execução](#-execução)
- [API Endpoints](#-api-endpoints)
- [MQTT Topics](#-mqtt-topics)
- [Desenvolvimento](#-desenvolvimento)
- [Roadmap](#-roadmap)
- [Contexto para IA](#-contexto-para-ia)
- [Troubleshooting](#-troubleshooting)
- [Licença](#-licença)

---

## 🎯 Visão Geral

EasySmart é uma plataforma IoT completa que permite:

- ✅ **Gerenciamento Multi-Tenant** de dispositivos IoT
- ✅ **Provisionamento automático** via ESPHome
- ✅ **Comunicação MQTT** em tempo real
- ✅ **Armazenamento de séries temporais** (InfluxDB)
- ✅ **Dashboard Web** para monitoramento
- ✅ **API REST** para integrações

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
│                        Port: 3001                            │
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

#### 1. Telemetria (Device → Cloud)
```
ESP32 → MQTT (publish) → Mosquitto → Backend → InfluxDB
                                    └─→ PostgreSQL (last_seen)
```

#### 2. Comandos (Cloud → Device)
```
Frontend → Backend → MQTT (publish) → Mosquitto → ESP32
```

#### 3. Provisionamento
```
ESPHome Dashboard → Compile → Flash → Device → Auto-discover (MQTT)
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

### Frontend (Futuro)
- **React** 18+
- **TypeScript**
- **Vite**
- **TailwindCSS**

### IoT
- **ESPHome** (Firmware framework)
- **ESP32 / ESP8266** (Hardware)
- **MQTT** 3.1.1 / 5.0 (Protocol)

### Infrastructure
- **Docker** & **Docker Compose**
- **Nginx** (Reverse proxy)
- **Portainer** (Container management)

---

## 📁 Estrutura do Projeto
```
easysmart-platform/
├── backend/                      # API Node.js
│   ├── src/
│   │   ├── config/              # Configurações
│   │   │   ├── database.js      # PostgreSQL pool
│   │   │   ├── influxdb.js      # InfluxDB client
│   │   │   ├── logger.js        # Pino logger
│   │   │   └── mqtt.js          # MQTT client
│   │   ├── controllers/         # Business logic
│   │   ├── middleware/          # Express middlewares
│   │   │   └── errorHandler.js  # Global error handler
│   │   ├── models/              # Data models
│   │   ├── routes/              # API routes
│   │   ├── services/            # External services
│   │   └── server.js            # Entry point
│   ├── .env                     # Environment variables
│   └── package.json
├── frontend/                     # React App (futuro)
├── docs/                        # Documentação adicional
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md                    # Este arquivo
```

### Backend: Estrutura Detalhada
```
backend/src/
├── config/                       # 🔧 Configurações
│   ├── database.js              # Pool PostgreSQL + test connection
│   ├── influxdb.js              # Write/Query API + flush
│   ├── logger.js                # Pino (pretty dev / JSON prod)
│   └── mqtt.js                  # Pub/Sub + reconnect logic
├── controllers/                  # 🎮 Lógica de negócio
│   ├── authController.js        # (futuro) Login, register
│   ├── deviceController.js      # (futuro) CRUD devices
│   └── telemetryController.js   # (futuro) Queries time-series
├── middleware/                   # 🛡️ Express middlewares
│   ├── errorHandler.js          # Global error + 404 handler
│   ├── auth.js                  # (futuro) JWT validation
│   └── validation.js            # (futuro) Request validation
├── models/                       # 📊 Data models
│   ├── User.js                  # (futuro)
│   ├── Tenant.js                # (futuro)
│   └── Device.js                # (futuro)
├── routes/                       # 🛣️ API routes
│   ├── index.js                 # (futuro) Router aggregator
│   ├── auth.js                  # (futuro) /api/v1/auth
│   ├── devices.js               # (futuro) /api/v1/devices
│   └── telemetry.js             # (futuro) /api/v1/telemetry
├── services/                     # 🔌 External services
│   ├── mqttService.js           # (futuro) MQTT handlers
│   └── esphomeService.js        # (futuro) ESPHome integration
└── server.js                     # 🚀 Application entry point
```

---

## ⚙️ Pré-requisitos

### Sistema Operacional
- Ubuntu 24.04 LTS (recomendado)
- Debian 12+
- Qualquer Linux com Docker

### Software
- **Node.js** >= 18.19.0 ([Download](https://nodejs.org/))
- **Docker** >= 20.10 ([Install](https://docs.docker.com/engine/install/))
- **Docker Compose** >= 2.0
- **Git** >= 2.30

### Portas Necessárias
```
3001  - Backend API
5432  - PostgreSQL
8086  - InfluxDB
1883  - MQTT (Mosquitto)
6052  - ESPHome Dashboard
8123  - Home Assistant (opcional)
9000  - Portainer
```

---

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/rodrigo-s-lange/easysmart-platform.git
cd easysmart-platform
```

### 2. Configure a infraestrutura (Docker)
```bash
# Criar arquivo .env para infraestrutura
cd ~/docker
cp .env.example .env

# Editar senhas (se necessário)
nano .env

# Iniciar serviços
docker compose up -d

# Verificar status
docker compose ps
```

### 3. Configure o backend
```bash
cd ~/easysmart-platform/backend

# Instalar dependências
npm install

# Criar .env
cp .env.example .env

# Editar variáveis de ambiente
nano .env
```

### 4. Criar banco de dados
```bash
# Criar database no PostgreSQL
docker exec -it postgres psql -U postgres -c "CREATE DATABASE easysmart;"

# Verificar
docker exec -it postgres psql -U postgres -c "\l" | grep easysmart
```

---

## �� Configuração

### Backend `.env`
```bash
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=easysmart

# InfluxDB Configuration
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token_here
INFLUXDB_ORG=easysmart
INFLUXDB_BUCKET=iot_data

# MQTT Configuration
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=devices
MQTT_PASSWORD=your_mqtt_password_here

# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# CORS (opcional)
CORS_ORIGIN=*

# JWT (futuro)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

### Obter Credenciais
```bash
# PostgreSQL password
grep POSTGRES_PASSWORD ~/docker/.env

# InfluxDB token
grep INFLUXDB_ADMIN_TOKEN ~/docker/.env

# MQTT password
grep MQTT_PASSWORD ~/docker/.env
```

---

## ▶️ Execução

### Desenvolvimento
```bash
cd ~/easysmart-platform/backend

# Modo watch (reinicia automaticamente)
npm run dev

# Logs coloridos com Pino Pretty
```

### Produção
```bash
# Modo produção (sem nodemon)
npm start

# Com PM2 (recomendado)
npm install -g pm2
pm2 start src/server.js --name easysmart-backend
pm2 save
pm2 startup
```

### Verificar Status
```bash
# Health check
curl http://localhost:3001/health

# Deve retornar:
{
  "status": "ok",
  "services": {
    "postgres": true,
    "influxdb": true,
    "mqtt": true
  }
}
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:3001
```

### Endpoints Atuais

#### `GET /`
Informações da API

**Response:**
```json
{
  "message": "EasySmart IoT Platform API",
  "version": "0.1.0",
  "endpoints": {
    "health": "/health",
    "api": "/api/v1"
  }
}
```

#### `GET /health`
Health check com status de todos os serviços

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T17:23:48.513Z",
  "uptime": 68.32,
  "environment": "development",
  "version": "0.1.0",
  "services": {
    "postgres": true,
    "influxdb": true,
    "mqtt": true
  }
}
```

**Status Codes:**
- `200` - Todos os serviços OK
- `503` - Algum serviço degradado

### Endpoints Futuros (Phase 1.2+)
```
POST   /api/v1/auth/register       # Criar conta
POST   /api/v1/auth/login          # Login
GET    /api/v1/devices             # Listar dispositivos
POST   /api/v1/devices             # Adicionar dispositivo
GET    /api/v1/devices/:id         # Detalhes do dispositivo
PUT    /api/v1/devices/:id         # Atualizar dispositivo
DELETE /api/v1/devices/:id         # Remover dispositivo
GET    /api/v1/telemetry/:deviceId # Dados de telemetria
POST   /api/v1/commands/:deviceId  # Enviar comando
```

---

## 📡 MQTT Topics

### Estrutura de Tópicos
```
easysmart/{DEVICE_ID}/{TYPE}/{ENTITY_ID}/{ACTION}
```

### Exemplos

#### Telemetria (Device → Cloud)
```bash
# Sensor de temperatura
easysmart/esp32-living-room/sensor/temperature/state
Payload: {"value": 23.5, "unit": "°C"}

# Sensor de umidade
easysmart/esp32-living-room/sensor/humidity/state
Payload: {"value": 65.2, "unit": "%"}

# Status de switch
easysmart/esp32-kitchen/switch/light/state
Payload: {"state": "ON"}
```

#### Comandos (Cloud → Device)
```bash
# Ligar luz
easysmart/esp32-kitchen/switch/light/command
Payload: "ON"

# Desligar luz
easysmart/esp32-kitchen/switch/light/command
Payload: "OFF"
```

#### Disponibilidade
```bash
# Device online
easysmart/esp32-living-room/availability
Payload: "online"

# Device offline (LWT - Last Will Testament)
easysmart/esp32-living-room/availability
Payload: "offline"
```

### QoS Levels

- **QoS 0** - At most once (telemetria não crítica)
- **QoS 1** - At least once (comandos, dados críticos)
- **QoS 2** - Exactly once (não usado por performance)

### Testar MQTT Manualmente
```bash
# Publicar mensagem
docker exec mosquitto mosquitto_pub \
  -h localhost \
  -u devices \
  -P 'your_mqtt_password' \
  -t 'easysmart/test/sensor/temp/state' \
  -m '{"value": 25.5}'

# Escutar tópico
docker exec mosquitto mosquitto_sub \
  -h localhost \
  -u devices \
  -P 'your_mqtt_password' \
  -t 'easysmart/#' \
  -v
```

---

## 👨‍💻 Desenvolvimento

### Convenções de Código

#### Git Commit Messages (Conventional Commits)
```bash
feat: nova funcionalidade
fix: correção de bug
docs: documentação
refactor: refatoração de código
test: testes
chore: tarefas de manutenção
perf: melhorias de performance
style: formatação de código
```

**Exemplos:**
```bash
git commit -m "feat: adiciona autenticação JWT"
git commit -m "fix: corrige conexão MQTT em ambiente Docker"
git commit -m "docs: atualiza README com endpoints da API"
```

#### Estrutura de Branches
```
main              # Produção (protegida)
develop           # Desenvolvimento
feature/*         # Novas funcionalidades
fix/*             # Correções de bugs
hotfix/*          # Correções urgentes
```

#### Code Style

- **Indentação:** 2 espaços
- **Quotes:** Single quotes `'`
- **Semicolons:** Obrigatório
- **Line length:** 100 caracteres
- **Naming:**
  - `camelCase` para variáveis/funções
  - `PascalCase` para classes
  - `UPPER_CASE` para constantes

### Logging com Pino
```javascript
const logger = require('./config/logger');

// Níveis disponíveis
logger.trace('trace message');
logger.debug('debug message');
logger.info('info message');
logger.warn('warning message');
logger.error({ err }, 'error message');
logger.fatal({ err }, 'fatal message');

// Structured logging
logger.info({
  userId: 123,
  action: 'login'
}, 'User logged in');
```

### Error Handling
```javascript
const { asyncHandler } = require('./middleware/errorHandler');

// Wrapper para async functions
router.get('/devices', asyncHandler(async (req, res) => {
  const devices = await Device.findAll();
  res.json(devices);
}));

// Erros customizados
const error = new Error('Device not found');
error.statusCode = 404;
throw error;
```

### Testes (Futuro)
```bash
# Instalar dependências de teste
npm install --save-dev jest supertest

# Rodar testes
npm test

# Coverage
npm run test:coverage
```

---

## 🗺️ Roadmap

### ✅ Phase 1.1 - Backend Base (CONCLUÍDA)
- [x] Setup projeto Node.js
- [x] Configuração PostgreSQL
- [x] Configuração InfluxDB
- [x] Configuração MQTT
- [x] Logger estruturado (Pino)
- [x] Error handling global
- [x] Health check endpoint

### 🔄 Phase 1.2 - Database & Auth (EM ANDAMENTO)
- [ ] Schema PostgreSQL (tenants, users, devices)
- [ ] Migrations com node-pg-migrate
- [ ] Autenticação JWT
- [ ] Middleware de autorização
- [ ] CRUD de usuários
- [ ] Multi-tenancy

### 📋 Phase 1.3 - Device Management
- [ ] CRUD de dispositivos
- [ ] Auto-discovery via MQTT
- [ ] Device provisioning
- [ ] Entity management
- [ ] Device status tracking

### 📊 Phase 1.4 - Telemetry & Analytics
- [ ] Ingestão de dados via MQTT
- [ ] Queries InfluxDB (Flux)
- [ ] Agregações e estatísticas
- [ ] Alertas e notificações
- [ ] Data retention policies

### 🎨 Phase 2.1 - Frontend Base
- [ ] Setup React + Vite
- [ ] Autenticação (login/register)
- [ ] Dashboard principal
- [ ] Listagem de dispositivos
- [ ] Gráficos em tempo real

### 🔌 Phase 2.2 - ESPHome Integration
- [ ] ESPHome config generator
- [ ] Firmware OTA updates
- [ ] Device templates
- [ ] WiFi provisioning

### 🚀 Phase 3.1 - Production Ready
- [ ] Docker multi-stage builds
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Backup automatizado
- [ ] Rate limiting
- [ ] API documentation (Swagger)

### 🌟 Phase 3.2 - Advanced Features
- [ ] Webhooks
- [ ] Integrações (Home Assistant, Alexa)
- [ ] Mobile app (React Native)
- [ ] Rules engine (automações)
- [ ] Marketplace de integrações

---

## 🤖 Contexto para IA

Este projeto é desenvolvido com assistência de IA (Claude). Siga estas diretrizes:

### Perfil do Desenvolvedor
- **Experiência:** Pleno/Sênior em Node.js, React, Python, C++
- **Embedded:** Avançado (ESP32, ESPHome, MQTT)
- **Linux:** Intermediário (precisa comandos explícitos)
- **Git:** Intermediário (precisa lembretes)

### Preferências de Comunicação
- ✅ Perguntas contextualizadas antes de prosseguir
- ✅ Buscar documentação oficial sempre
- ✅ Direto e técnico, sem emojis excessivos
- ✅ Um passo de cada vez, aguardar confirmação
- ❌ Sem TODOs ou placeholders em código
- ❌ Sem pular etapas de teste

### Regras de Desenvolvimento
1. **Código completo** - Sempre funcional, sem placeholders
2. **Testar sempre** - Validar antes de prosseguir
3. **EOF format** - Usar `cat > file << 'EOF'` para arquivos
4. **Commits frequentes** - feat/fix/docs/refactor
5. **Perguntar antes** - Contextualizar necessidade

### Arquitetura de Decisão
```
Precisa buscar docs atualizadas?
  ├─ SIM → Buscar antes de implementar
  └─ NÃO → Implementar com conhecimento base

Mudança estrutural?
  ├─ SIM → Discutir alternativas
  └─ NÃO → Implementar diretamente

Código funcionando?
  ├─ SIM → Commit + próxima etapa
  └─ NÃO → Debug passo a passo
```

### Comandos Úteis para IA Lembrar
```bash
# Ver infraestrutura
cd ~/docker && docker compose ps

# Ver logs de serviço
docker logs <service> --tail 50 -f

# Reiniciar serviço
docker compose restart <service>

# Git workflow
git status
git add .
git commit -m "type: message"
git push origin main

# Backend
cd ~/easysmart-platform/backend
npm run dev          # Desenvolvimento
npm start            # Produção

# Testar API
curl http://localhost:3001/health
```

### Credenciais (Lembrar de buscar no .env)
```bash
# PostgreSQL
grep POSTGRES_PASSWORD ~/docker/.env

# InfluxDB
grep INFLUXDB_ADMIN_TOKEN ~/docker/.env

# MQTT
grep MQTT_PASSWORD ~/docker/.env
```

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Verificar logs
cd ~/easysmart-platform/backend
npm run dev

# Verificar se portas estão livres
netstat -tulpn | grep -E '3001|5432|8086|1883'

# Verificar serviços Docker
docker compose ps
```

### Erro "database does not exist"
```bash
# Criar banco manualmente
docker exec -it postgres psql -U postgres -c "CREATE DATABASE easysmart;"
```

### MQTT não conecta
```bash
# Verificar logs Mosquitto
docker logs mosquitto --tail 50

# Testar conexão
docker exec mosquitto mosquitto_pub -h localhost -u devices -P 'senha' -t 'test' -m 'hello'

# Verificar credenciais
grep MQTT_PASSWORD ~/docker/.env
```

### InfluxDB não conecta
```bash
# Verificar logs
docker logs influxdb --tail 50

# Verificar token
docker exec influxdb influx auth list

# Recriar token (se necessário)
docker exec influxdb influx auth create \
  --org easysmart \
  --all-access
```

### PostgreSQL connection timeout
```bash
# Reiniciar PostgreSQL
docker compose restart postgres

# Verificar logs
docker logs postgres --tail 50

# Testar conexão
docker exec postgres psql -U postgres -c "SELECT 1;"
```

### Limpar e reconstruir tudo
```bash
# CUIDADO: Apaga todos os dados!
cd ~/docker
docker compose down -v
docker compose up -d

# Recriar banco
docker exec -it postgres psql -U postgres -c "CREATE DATABASE easysmart;"

# Reiniciar backend
cd ~/easysmart-platform/backend
npm run dev
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

- [ESPHome](https://esphome.io/) - Excelente framework para ESP32/ESP8266
- [Express.js](https://expressjs.com/) - Web framework para Node.js
- [InfluxDB](https://www.influxdata.com/) - Time-series database
- [Eclipse Mosquitto](https://mosquitto.org/) - MQTT broker
- [Pino](https://getpino.io/) - Fast logger para Node.js

---

**Last Updated:** 2025-10-16  
**Version:** 0.1.0  
**Status:** Phase 1.1 Complete ✅
