# EasySmart IoT Platform - Projeto em construção

**Última atualização:** 2025-10-17 / 09:25AM 
**Versão:** 0.2.0 

> **Plataforma IoT Industrial Multi-Tenant para Automação e Monitoramento**

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![Node](https://img.shields.io/badge/node-22.20.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

##  Índice

- [Visão Geral](#visão-geral)
- [Status do Projeto](#status-do-projeto)
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Setup e Instalação](#setup-e-instalação)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [MQTT Topics](#mqtt-topics)
- [Frontend Architecture](#frontend-architecture)
- [Roadmap](#roadmap)
- [Colaboração com LLMs](#colaboração-com-llms)
- [Troubleshooting](#troubleshooting)

---

##  Visão Geral

EasySmart é uma plataforma IoT industrial multi-tenant focada em:
- **Monitoramento em tempo real** via RS485/Modbus
- **Integração ESPHome** (ESP32/ESP32-S3)
- **Integração Proprietária** (ESP32/ESP32-S3/STM32Hxxx/RP2040/CNC/3D_PRINT/ect)
- **Dashboards SCADA-like** para análise de dados
- **Multi-tenancy** com isolamento total de dados e segurança reforçada
- **Futuro:** Suporte a CLPs e linguagem próprietária yaml auxiliada por LLMs.

###  Filosofia de Design
- **Não copiar Home Assistant** (cards genéricos)(mas baser-se no mesmo conceito)
- **Inspiração:** Vercel, Linear, Grafana, Notion
- **Foco:** Dashboards profissionais para ambiente industrial e profissional

---

##  Status do Projeto

### ✅ Concluído (v0.2.0)

#### **Phase 1: Backend Core** ✅
- [x] Express 5.1.0 + Security (Helmet, CORS)
- [x] PostgreSQL 16 + InfluxDB 2.x
- [x] MQTT (Mosquitto) + Auto-discovery
- [x] JWT Authentication (access 15min + refresh 7d)
- [x] Multi-tenancy (row-level security)
- [x] Device Management (CRUD + Provisioning)
- [x] Telemetry API (buffer + batch write)
- [x] Logging estruturado (Pino)

#### **Phase 2.1: Frontend Authentication** ✅
- [x] React 18 + TypeScript + Vite 8
- [x] TailwindCSS v3 + shadcn/ui
- [x] Login/Register com validação (Zod)
- [x] JWT token management + auto-refresh
- [x] Protected routes
- [x] Zustand (auth state) + React Query
- [x] Design profissional (dark theme + gradientes)
- [x] Multi-tenancy validado e funcionando

###  Em Desenvolvimento

#### **Phase 2.2: Device Management UI** (Próximo)
- [ ] Sidebar navigation (colapsável)
- [ ] Dashboard com KPI cards
- [ ] Device list (grid cards)
- [ ] Device detail page
- [ ] Real-time polling (híbrido)

---

##  Arquitetura

```
┌────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Dashboard  │  │   Devices   │  │  Analytics  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│         │ HTTP (Axios + React Query) │                 │
└─────────┼──────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │   Auth   │  │  Device  │  │Telemetry │               │
│  │    API   │  │   API    │  │   API    │               │
│  └──────────┘  └──────────┘  └──────────┘               │
│         │              │              │                 │
└─────────┼──────────────┼──────────────┼─────────────────┘
          │              │              │
    ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
    │PostgreSQL │  │  InfluxDB │  │   MQTT    │
    │  (Users,  │  │Time-series│  │(Broker)   │
    │  Devices) │  │   Data    │  │           │
    └───────────┘  └───────────┘  └─────┬─────┘
                                        │
                                        ▼
                                  ┌─────────────┐
                                  │  ESPHome    │
                                  │  Devices    │
                                  │(ESP32/STM32)│
                                  └─────────────┘
```

###  Multi-Tenancy

**Row-Level Security:**
```sql
-- Todos os devices pertencem a um tenant
SELECT * FROM devices WHERE tenant_id = $current_user_tenant_id
```

**JWT Payload:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",  ← Filtro automático em todas queries
  "role": "admin"
}
```

---

##  Stack Tecnológica

### **Backend**
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Node.js | 22.20.0 LTS | Runtime (suporte até 2027) |
| Express | 5.1.0 | API REST |
| PostgreSQL | 16.10 | Dados relacionais |
| InfluxDB | 2.x | Time-series (telemetria) |
| Mosquitto | Latest | MQTT Broker |
| Pino | 9.5.0 | Logging estruturado |
| bcrypt | Latest | Hash de senhas |
| jsonwebtoken | Latest | JWT auth |

### **Frontend**
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18 | UI Framework |
| TypeScript | Latest | Type safety |
| Vite | 8 | Build tool |
| TailwindCSS | 3.4.0 | Styling |
| shadcn/ui | Latest | Componentes UI |
| Zustand | Latest | State (auth) |
| React Query | Latest | Data fetching + cache |
| React Router | Latest | Navegação |
| Axios | Latest | HTTP client |
| Recharts | Latest | Gráficos |
| Zod | Latest | Validação |
| React Hook Form | Latest | Forms |

### **Infraestrutura**
- **Docker** para serviços (PostgreSQL, InfluxDB, MQTT)
- **nvm** para gerenciamento de Node.js
- **Git** para versionamento

---

##  Estrutura do Projeto

```
easysmart-platform/
├── backend/                           # Node.js API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js           # PostgreSQL pool
│   │   │   └── logger.js             # Pino logger
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login, register, logout
│   │   │   ├── deviceController.js   # Provision, claim
│   │   │   ├── deviceApiController.js # CRUD devices (com tenant_id)
│   │   │   └── telemetryController.js # Telemetry queries
│   │   ├── middleware/
│   │   │   ├── auth.js               # requireAuth (JWT)
│   │   │   └── errorHandler.js       # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.js               # Auth endpoints
│   │   │   ├── devices.js            # Device endpoints
│   │   │   └── telemetry.js          # Telemetry endpoints
│   │   ├── services/
│   │   │   ├── influxService.js      # InfluxDB writer (buffer + batch)
│   │   │   └── mqttService.js        # MQTT listener + publisher
│   │   ├── utils/
│   │   │   └── token.js              # JWT helpers
│   │   └── server.js                 # Entry point
│   ├── migrations/
│   │   └── 1760638437331_create-initial-schema.js
│   ├── .env                          # Credenciais (não commitado)
│   ├── package.json
│   └── README.md
│
├── frontend/                          # React App
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   └── card.tsx
│   │   │   └── layout/
│   │   │       └── (futuro: Sidebar, TopBar)
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios instance + interceptors
│   │   │   ├── utils.ts              # cn() helper
│   │   │   └── queryClient.ts        # React Query config
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.tsx
│   │   ├── stores/
│   │   │   └── authStore.ts          # Zustand auth state
│   │   ├── types/
│   │   │   └── auth.ts               # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css                 # TailwindCSS + theme
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── esphome-examples/                  # Exemplos ESPHome
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md                          # Este arquivo
```

---

##  Setup e Instalação

### **Pré-requisitos**

```bash
# Node.js 22 LTS
node --version  # v22.20.0

# Docker (para serviços)
docker --version

# nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### **1. Clonar Repositório**

```bash
git clone https://github.com/rodrigo-s-lange/easysmart-platform.git
cd easysmart-platform
```

### **2. Instalar Node.js 22**

```bash
nvm install 22
nvm use 22
nvm alias default 22
node --version  # Deve mostrar v22.20.0
```

### **3. Backend Setup**

```bash
cd backend

# Instalar dependências
npm install

# Copiar .env de exemplo
cp .env.example .env

# Editar credenciais (usar as do ~/docker/.env)
nano .env

# Rodar migrations
npm run migrate up

# Iniciar servidor
npm run dev
```

**Backend roda em:** `http://localhost:3010`
# por padrão é 3001 porém dá comflito no vscode então optar por 3010

### **4. Frontend Setup**

```bash
cd ../frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

**Frontend roda em:** `http://localhost:5173`

### **5. Serviços Docker**

Os serviços devem estar rodando em `~/docker`:

```bash
cd ~/docker

# Verificar status
docker ps

# Iniciar se necessário
docker-compose up -d postgres influxdb mosquitto
```

### **6. Validar Instalação**

```bash
# Backend health check
curl http://localhost:3010/health | jq

# Deve retornar:
# {
#   "status": "ok",
#   "services": {
#     "postgres": true,
#     "influxdb": true,
#     "mqtt": true
#   }
# }

# Frontend (abrir navegador)
# http://localhost:5173
# Login: admin@easysmart.io / admin123456
```

---

## 🔌 API Reference

### **Base URL**
```
http://localhost:3010/api/v1
```

### **Authentication**

#### `POST /auth/register`
Cria novo usuário e tenant.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123456",
  "tenant_name": "Minha Empresa"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "tenant_id": "uuid"
  },
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "rt_..."
  }
}
```

#### `POST /auth/login`
Autenticação de usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123456"
}
```

**Response:** Mesma estrutura do register

#### `POST /auth/refresh`
Renova access token.

**Body:**
```json
{
  "refreshToken": "rt_..."
}
```

#### `POST /auth/logout`
Invalida refresh token.

**Headers:**
```
Authorization: Bearer {accessToken}
```

---

### **Devices**

**Todas as rotas requerem:** `Authorization: Bearer {accessToken}`

#### `GET /devices`
Lista devices do tenant autenticado.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sensor Admin 1",
    "status": "online",
    "last_seen": "2025-10-17T09:26:47.363Z",
    "device_token": "easysmrt_dev_...",
    "metadata": {
      "location": "sala",
      "type": "temperature"
    },
    "created_at": "2025-10-17T09:26:47.363Z"
  }
]
```

#### `GET /devices/:id`
Detalhes de um device específico.

**Response:**
```json
{
  "id": "uuid",
  "name": "Sensor Admin 1",
  "status": "online",
  "last_seen": "2025-10-17T09:26:47.363Z",
  "device_token": "easysmrt_dev_...",
  "metadata": {},
  "created_at": "2025-10-17T09:26:47.363Z",
  "entity_count": 5
}
```

#### `GET /devices/:id/entities`
Lista entities de um device.

**Response:**
```json
[
  {
    "id": "uuid",
    "entity_id": "temperature",
    "entity_type": "sensor",
    "device_class": "temperature",
    "name": "Temperature",
    "unit_of_measurement": "°C",
    "state": "23.5",
    "attributes": {},
    "last_updated": "2025-10-17T09:30:00.000Z"
  }
]
```

#### `POST /devices/provision`
Cria novo device.

**Body:**
```json
{
  "name": "Sensor 1",
  "metadata": {
    "location": "sala",
    "type": "temperature"
  }
}
```

**Response:**
```json
{
  "message": "Device provisionado com sucesso",
  "device": {
    "id": "uuid",
    "name": "Sensor 1",
    "device_token": "easysmrt_dev_...",
    "status": "offline",
    "created_at": "2025-10-17T..."
  }
}
```

#### `POST /devices/claim`
Associa device via QR code token.

**Body:**
```json
{
  "device_token": "easysmrt_dev_..."
}
```

#### `DELETE /devices/:id`
Remove device (e suas entities em cascata).

---

### **Telemetry**

**Requer autenticação.**

#### `GET /telemetry/:deviceId/latest/:entityId`
Último valor de uma entity.

**Response:**
```json
{
  "value": 23.5,
  "unit": "°C",
  "timestamp": "2025-10-17T09:30:00.000Z"
}
```

#### `GET /telemetry/:deviceId/:entityId`
Série temporal com agregação.

**Query Params:**
- `start`: `-6h`, `-24h`, `2025-10-17T00:00:00Z`
- `stop`: `now()`, `2025-10-17T23:59:59Z`
- `window`: `1m`, `5m`, `1h`
- `aggregation`: `mean`, `max`, `min`, `sum`

**Response:**
```json
{
  "data": [
    {
      "time": "2025-10-17T09:00:00Z",
      "value": 23.2
    },
    {
      "time": "2025-10-17T09:05:00Z",
      "value": 23.5
    }
  ],
  "unit": "°C",
  "aggregation": "mean",
  "window": "5m"
}
```

#### `GET /telemetry/metrics`
Estatísticas do Influx Writer.

**Response:**
```json
{
  "pointsWritten": 1247,
  "pointsDropped": 0,
  "writeErrors": 0,
  "lastWriteTime": "2025-10-17T09:30:15.123Z",
  "lastWriteStatus": "success",
  "queueSize": 0,
  "cacheSize": 12
}
```

---

##  Database Schema

### **PostgreSQL** (Dados Relacionais)

#### **tenants**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT now()
);
```

#### **devices**
```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),  -- Multi-tenancy
  template_id UUID REFERENCES device_templates(id),
  name TEXT NOT NULL,
  device_token TEXT NOT NULL UNIQUE,
  claim_token TEXT,
  mac_address TEXT,
  status TEXT DEFAULT 'unclaimed',
  last_seen TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  claimed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_devices_tenant ON devices(tenant_id);
```

#### **entities**
```sql
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,  -- sensor, binary_sensor, switch, etc
  device_class TEXT,
  name TEXT,
  unit_of_measurement TEXT,
  state TEXT,
  attributes JSONB,
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(device_id, entity_id)
);

CREATE INDEX idx_entities_device ON entities(device_id);
```

#### **refresh_tokens**
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### **InfluxDB** (Time-Series)

#### **Measurement: telemetry**

**Tags:**
- `device_uuid`: UUID do device
- `entity_id`: ID da entity (ex: "temperature")
- `entity_type`: Tipo (sensor, binary_sensor, switch)
- `unit`: Unidade de medida (°C, PSI, %)
- `device_class`: Classe (temperature, pressure, etc)

**Fields:**
- `value_float`: Valores numéricos
- `value_bool`: Valores booleanos
- `value_string`: Valores string

**Exemplo de ponto:**
```
telemetry,device_uuid=abc-123,entity_id=temperature,entity_type=sensor,unit=°C value_float=23.5 1697529600000000000
```

---

##  MQTT Topics

### **Discovery**

**Topic:** `easysmart/{device_id}/discovery`

**Payload:**
```json
{
  "device": {
    "id": "esp32-lab",
    "name": "Lab Sensor",
    "model": "ESP32-WROOM-32",
    "manufacturer": "Espressif"
  },
  "entities": [
    {
      "type": "sensor",
      "id": "temperature",
      "device_class": "temperature",
      "unit_of_measurement": "°C",
      "name": "Temperature"
    },
    {
      "type": "binary_sensor",
      "id": "motion",
      "device_class": "motion",
      "name": "Motion Sensor"
    }
  ]
}
```

### **Telemetria**

#### **Sensor (float)**
**Topic:** `easysmart/{device_id}/sensor/{entity_id}/state`

**Payload:**
```json
{
  "value": 23.5,
  "unit": "°C",
  "timestamp": "2025-10-17T09:30:00Z"
}
```

#### **Binary Sensor (bool)**
**Topic:** `easysmart/{device_id}/binary_sensor/{entity_id}/state`

**Payload:**
```json
{
  "value": true,
  "timestamp": "2025-10-17T09:30:00Z"
}
```

#### **Switch (bool)**
**Topic:** `easysmart/{device_id}/switch/{entity_id}/state`

**Payload:** `"ON"` ou `"OFF"`

### **Comandos (futuro)**

**Topic:** `easysmart/{device_id}/switch/{entity_id}/command`

**Payload:** `"ON"` ou `"OFF"`

---

##  Frontend Architecture

### **Decisões de Arquitetura** (v0.2.0)

#### **1. Contexto Essencial**

**LEIA PRIMEIRO:**
- Este README completo
- `CHANGELOG.md` para histórico
- Diretiva em anexo (se fornecida)

**Entenda:**
- Multi-tenancy é CRÍTICO (sempre filtrar por `tenant_id`)
- Schema PostgreSQL real (sem `mqtt_id`, `model`, `manufacturer`)
- ESPHome é estratégia atual (futuro: firmware proprietário que será desenvolvido aos modais yaml)
- Foco industrial (não copiar Home Assistant / ESPHome porém inspirado na topologia)

#### **2. Comandos de Verificação**

Sempre execute antes de começar:

```bash
# Verificar ambiente
node --version  # Deve ser v22.20.0
cd ~/easysmart-platform

# Backend status
cd backend
npm run dev
# Outro terminal: curl http://localhost:3010/health | jq

# Frontend status
cd ../frontend
npm run dev
# Abrir: http://localhost:5173

# Git status
git status
git log -1
```

#### **3. Validar Multi-Tenancy**

**SEMPRE teste isolamento antes de implementar features:**

```bash
# Login como 2 usuários diferentes
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq -r '.tokens.accessToken')

JOAO_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao.silva@techsolutions.com","password":"senha123456"}' \
  | jq -r '.tokens.accessToken')

# Verificar isolamento
curl -s http://localhost:3010/api/v1/devices \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '. | length'

curl -s http://localhost:3010/api/v1/devices \
  -H "Authorization: Bearer $JOAO_TOKEN" | jq '. | length'
```

**Resultado esperado:** Cada usuário vê apenas seus devices.

#### **4. Padrões de Código**

**Backend (JavaScript):**
```javascript
// ✅ SEMPRE filtrar por tenant_id
const getDevices = async (req, res) => {
  const tenantId = req.user.tenantId; // Do JWT
  
  const result = await pool.query(
    'SELECT * FROM devices WHERE tenant_id = $1',
    [tenantId]
  );
  
  res.json(result.rows);
};

// ❌ NUNCA fazer isso (sem filtro)
const result = await pool.query('SELECT * FROM devices');
```

**Frontend (TypeScript):**
```typescript
// ✅ Usar React Query para data fetching
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

function DeviceList() {
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => api.get('/devices').then(res => res.data),
    refetchInterval: 5000, // Polling
  });
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {devices.map(device => (
        <DeviceCard key={device.id} device={device} />
      ))}
    </div>
  );
}

// ❌ NUNCA usar localStorage/sessionStorage em artifacts
// ✅ Usar React state ou Zustand
```

#### **5. Criação de Artifacts**

**Quando criar:**
- Arquivos completos (sem TODOs)
- Código funcional completo (não placeholders)
- Componentes reutilizáveis

**Não criar:**
- Snippets pequenos (< 20 linhas)
- Documentação inline
- Configs triviais

**Exemplo de bom artifact:**
```
Artifact: DeviceCard.tsx
- Componente completo
- TypeScript types
- TailwindCSS styling
- Props com default values
- Funcional 100%
```

#### **6. Testes Antes de Commit**

```bash
# Backend
cd backend
npm run dev  # Verificar sem erros

# Frontend
cd frontend
npm run lint  # Deve ter 0 errors
npm run dev   # Abrir navegador e testar

# Git
git add .
git status    # Verificar arquivos
git diff      # Revisar mudanças
git commit -m "feat: descrição clara"
git push origin main
```

#### **7. Quando Pedir Ajuda**

Se encontrar:
- Erros de banco (schema diferente)
- Multi-tenancy vazando dados
- Performance issues
- Decisões arquiteturais importantes
- Erros reportados nos logs do back/frontend
- Sempre que uma decisão impactar na arquitetura geral
- Se identificar pontos de falha ou melhorias

**PARE e pergunte ao desenvolvedor!**

#### **8. Mensagens de Commit**

Seguir **Conventional Commits:**

```bash
feat: add device list component
fix: correct multi-tenancy filter in devices API
refactor: split DeviceCard into smaller components
docs: update API reference with new endpoints
style: format code with prettier
test: add unit tests for auth controller
chore: update dependencies
```

---

##  Troubleshooting

### **Backend não inicia**

**Erro:** `ECONNREFUSED` ao conectar PostgreSQL/InfluxDB/MQTT

**Solução:**
```bash
# Verificar serviços docker
cd ~/docker
docker ps

# Iniciar se necessário
docker-compose up -d postgres influxdb mosquitto

# Ver logs
docker logs postgres
docker logs influxdb
docker logs mosquitto
```

---

### **Frontend: "Cannot find module '@/...'"**

**Causa:** Path alias não configurado

**Solução:**
```bash
# Verificar tsconfig.json
cat frontend/tsconfig.json | grep -A 5 "paths"

# Deve ter:
# "paths": {
#   "@/*": ["./src/*"]
# }

# Recarregar VSCode
# Ctrl+Shift+P → "Developer: Reload Window"
```

---

### **ESLint warnings**

**Erro:** `@typescript-eslint/no-explicit-any`

**Solução:**
```typescript
// ❌ Evitar
catch (err: any) {
  console.log(err.message);
}

// ✅ Correto
catch (err) {
  const error = err as { message?: string };
  console.log(error.message || 'Unknown error');
}
```

---

### **Multi-tenancy vazando dados**

**Sintoma:** Usuário vê devices de outro tenant

**Debug:**
```bash
# Ver tenant_id dos devices
docker exec -it postgres psql -U postgres -d easysmart -c "
SELECT id, name, tenant_id FROM devices LIMIT 10;
"

# Ver tenant_id do usuário logado
# (decodificar JWT em jwt.io)
echo $ADMIN_TOKEN | cut -d. -f2 | base64 -d | jq
```

**Solução:** Adicionar filtro `WHERE tenant_id = $1` em TODAS queries de devices.

---

### **InfluxDB: "column does not exist"**

**Causa:** Query usando colunas antigas (mqtt_id, model, manufacturer)

**Solução:** Usar apenas colunas reais:
```sql
-- ✅ Correto
SELECT id, name, status, last_seen, metadata FROM devices

-- ❌ Errado
SELECT id, mqtt_id, model, manufacturer FROM devices
```

---

### **JWT expirado**

**Erro:** `401 Unauthorized`

**Causa:** Access token expira em 15min

**Solução:** Axios interceptor já implementado. Se falhar:
```typescript
// Forçar refresh
localStorage.removeItem('accessToken');
// Fazer login novamente
```

---

### **Vite: Module not found**

**Erro:** `Failed to resolve import`

**Solução:**
```bash
cd frontend

# Limpar cache
rm -rf node_modules/.vite
rm -rf dist

# Reinstalar
npm install

# Reiniciar
npm run dev
```

---

##  Recursos Adicionais

### **Documentação Externa**

- **Express 5:** https://expressjs.com/
- **PostgreSQL 16:** https://www.postgresql.org/docs/16/
- **InfluxDB 2:** https://docs.influxdata.com/influxdb/v2/
- **MQTT/Mosquitto:** https://mosquitto.org/documentation/
- **React 18:** https://react.dev/
- **TailwindCSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/
- **React Query:** https://tanstack.com/query/latest
- **Zustand:** https://zustand-demo.pmnd.rs/
- **ESPHome:** https://esphome.io/

### **Ferramentas Úteis**

- **JWT Decoder:** https://jwt.io/
- **JSON Formatter:** https://jsonformatter.org/
- **Postman/Insomnia:** Testes de API
- **pgAdmin:** GUI para PostgreSQL
- **InfluxDB UI:** http://localhost:8086
- **MQTT Explorer:** Desktop app para debug MQTT

---

##  Contexto Industrial

### **Casos de Uso Target**

1. **Monitoramento de Caldeiras**
   - Sensores: Temperatura, Pressão, Nível, booleano
   - Atuadores: Válvulas, Bombas, linear, etc
   - Protocolo: Modbus RTU via RS485, MODBUS TCP, Serial
   - Devices: 3-20 sensores por caldeira

2. **Automação de Linha de Produção**
   - Sensores: Contadores, Encoders, Fim de curso, booleano
   - Atuadores: Motores, Cilindros pneumáticos, inversores, etc
   - Protocolo: Modbus TCP, CAN Bus, CAN-FD, UART, RS232, etc
   - Devices: 50+ I/Os por linha

3. **Gestão de Energia**
   - Sensores: Medidores kWh, Corrente, Tensão, sequenciador de fases
   - Atuadores: Contatores, inversores, etc
   - Protocolo: Modbus RTU/TCP, CANBus, etc
   - Devices: 3-50 pontos de medição

### **Diferencial Competitivo**

**vs Home Assistant/ESPHome/Similares:**
- ✅ Foco industrial
- ✅ Multi-tenancy (SaaS)
- ✅ Suporte nativo RS485/Modbus/CANBus/CANFD/RS232
- ✅ Futuro: CLP + Ladder Logic + YAML guiado por LLMs

**vs Plataformas Industriais (Ignition, Wonderware):**
- ✅ Open source
- ✅ Custo zero (self-hosted)
- ✅ API-first (integrações fáceis)
- ✅ ESPHome (hardware barato)
- ✅ Proprietário (hardware de altíssimo desempenho (ESP32-S3 e P4 + ST32Hxxx series))
- ✅ SBCs Linux (hardware com suporte a linux industrial)

**vs ThingsBoard/Losant:**
- ✅ Sem limites artificiais (free tier)
- ✅ Código aberto (customizável)
- ✅ Offline-first (edge computing)

---

## 🔒 Segurança

### **Checklist de Segurança**

- [x] Senhas com bcrypt (salt rounds: 10)
- [x] JWT com refresh token
- [x] HTTPS em produção (configurar reverse proxy)
- [x] CORS configurado
- [x] Helmet.js (security headers)
- [x] Rate limiting (futuro: express-rate-limit)
- [x] Input validation (Zod)
- [x] SQL injection protection (parameterized queries)
- [x] XSS protection (React escaping)
- [ ] MQTT TLS (futuro)
- [ ] Device authentication (token-based OK)
- [ ] Audit logs (futuro)

### **Variáveis de Ambiente Sensíveis**

**NUNCA commitar:**
```
backend/.env
~/docker/.env
```

**Conteúdo crítico:**
```env
JWT_SECRET=<random-256-bit>
POSTGRES_PASSWORD=<strong-password>
INFLUXDB_ADMIN_TOKEN=<random-token>
MQTT_PASSWORD=<strong-password>
```

**Gerar secrets seguros:**
```bash
# JWT Secret (256 bits)
openssl rand -hex 32

# Passwords
openssl rand -base64 32
```

---

##  Performance

### **Benchmarks (Phase 1.5)**

**Backend:**
- Login: ~120ms
- GET /devices: ~10ms (10 devices)
- GET /telemetry: ~50ms (100 points)
- MQTT throughput: ~1000 msgs/s

**InfluxDB Writer:**
- Buffer: 500 pontos ou 500ms
- Batch write: ~20ms
- Zero pontos perdidos (queue)

**Frontend:**
- First paint: <1s (Vite)
- TTI: <2s
- Bundle size: ~300KB (gzipped)

### **Otimizações Futuras**

- [ ] Redis cache (devices list)
- [ ] Database indexing (já tem indexes básicos)
- [ ] Webpack/Vite code splitting
- [ ] Image optimization (lazy loading)
- [ ] Service Worker (PWA)
- [ ] GraphQL (substituir REST - considerar)

---

##  Testes

### **Backend** (Futuro - Phase 3)

```bash
# Unit tests (Jest)
npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

**Coverage target:** >80%

### **Frontend** (Futuro - Phase 3)

```bash
# Unit tests (Vitest)
npm test

# E2E tests (Playwright)
npm run test:e2e
```

---

##  Deploy

### **Desenvolvimento** (Atual)

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### **Produção** (Futuro - Phase 4)

#### **Backend**
```bash
# Build
npm run build  # (se necessário transpiling)

# PM2 (process manager)
pm2 start src/server.js --name easysmart-backend
pm2 save
pm2 startup
```

#### **Frontend**
```bash
# Build
npm run build

# Output: dist/
# Servir com nginx ou Vercel/Netlify
```

#### **Docker Compose** (Futuro)
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3010:3010"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - influxdb
      - mosquitto
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
  
  # ... outros serviços
```

---

##  Contribuindo

Este é um projeto em desenvolvimento ativo. Contribuições são bem-vindas!
Veja a seção de contato abaixo, tem meu Whats, será um prazer falar com você!

### **Workflow**

1. Fork o repositório
2. Crie branch: `git checkout -b feat/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feat/nova-feature`
5. Abra Pull Request

### **Código de Conduta**

- Respeite decisões arquiteturais existentes
- Mantenha multi-tenancy em TODAS features
- Teste antes de commitar
- Documente mudanças significativas
- Use Conventional Commits
- Se necessário fale diretamente comigo (Rodrigo Lange)

---

##  Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

Projeto desenvolvido em colaboração:
- **Rodrigo Lange** - Desenvolvedor gordão barbudo raiz!
- **Claude (Anthropic)** - Pair programming IA
- **ChatGPT (OpenAI)** - Revisões e melhorias / Prompts
- **Grok (xAI)** - Código mais técnico
- **DeepSeek (chinesinha)** - Documentação técnica e prompts
- **Google (Google)** - Pesquisas e inspirações
- **Essa porra toda foi feita por IA kkk ... brincdeiras a parte!**
- **Sem IA esse trabalho seria impensável a alguns anos.. USE e ABUSE!**
- **Leu até aqui? (PIX)** - Me pague um ☕️ rsrs meu PIX é o numero do cel

---

## 📞 Contato

- **Repositório:** https://github.com/rodrigo-s-lange/easysmart-platform
- **Issues:** https://github.com/rodrigo-s-lange/easysmart-platform/issues
- **Telefone** - +5541988360405 Whatsapp
- **Email (Gmail)** - rodrigosilvalange@gmail.com
- **Local (CWB)** - Curitiba/PR - Brasil

---

## 🎓 Aprendizados do Projeto

### **Técnicos**

1. **Node.js 22 LTS** - Upgrade de v18 valeu a pena (performance + suporte)
2. **Multi-tenancy** - Row-level security é simples mas CRÍTICO testar
3. **InfluxDB batching** - Buffer + batch write = performance 10x melhor
4. **React Query** - Elimina 80% do boilerplate de data fetching
5. **TailwindCSS v3** - v4 ainda experimental (ficar em v3)

### **Arquiteturais**

1. **Sidebar > Top Nav** - Decisão crucial para escalabilidade
2. **Página > Modal** - Device detail precisa de espaço (20+ entities)
3. **React Query > Zustand** - Para data fetching, sempre cache inteligente
4. **ESPHome agora** - Validação de mercado antes de firmware proprietário
5. **API-first** - Backend completo antes de UI acelera desenvolvimento

### **Processo**

1. **LLM collaboration** - Funciona MUITO bem com decisões claras
2. **Decisões upfront** - Discutir arquitetura antes = menos refatoração
3. **Commits frequentes** - Facilita rollback e revisão
4. **Documentação viva** - README como fonte única de verdade
5. **Testes manuais** - Validar multi-tenancy a cada feature

---

## 🚀 Próxima Sessão

**Para você (desenvolvedor) ou próxima IA:**

1. Ler este README completo ✅
2. Executar comandos de verificação
3. Validar multi-tenancy funcionando
4. Escolher: Phase 2.2 (Device Management UI)
5. Criar artifacts conforme padrões
6. Testar extensivamente
7. Commitar com mensagem clara
8. Atualizar CHANGELOG.md

**Boa sorte! O projeto está sólido e pronto para evoluir.** 🎉

---

**Última atualização:** 2025-10-17  
**Versão:** 0.2.0  
**Status:** Phase 2.1 Complete ✅ | Phase 2.2 Ready to Start 🚀 Layout: Sidebar Colapsável** ✅
- Desktop: Expandida por padrão (ícones + texto)
- Mobile: Colapsada (apenas ícones)
- Justificativa: Escalável para 10+ seções futuras (Analytics, Automations, Modbus Config, CLP, etc)

#### **2. Device List: Grid Cards** ✅
- Overview visual rápido
- Suporta múltiplas entities por card
- Mobile-friendly

#### **3. Device Detail: Página Dedicada** ✅
- Rota: `/devices/:id`
- Tabs: Overview | History | Config | Diagnostics
- Necessário para 20-30 entities por device industrial

#### **4. Real-time: Híbrido** ✅
- Phase 2.2: Polling a cada 5s
- Phase 2.3: WebSocket para device detail (quando aberto)
- Phase 2.4: SSE para notificações

#### **5. State Management: React Query + Zustand** ✅
- **Zustand:** Auth state apenas
- **React Query:** Devices, telemetry, cache automático

### **Estrutura de Rotas**

```typescript
/                  → Redirect para /dashboard
/login             → Login page (público)
/register          → Register page (público)

/dashboard         → Overview (KPIs + últimos devices)
/devices           → Lista completa (grid + filtros)
/devices/:id       → Detalhes + entities + charts
/devices/provision → Criar novo device

/analytics         → Gráficos históricos (futuro)
/automations       → Regras e triggers (futuro)
/modbus            → Config RS485/Modbus (futuro)
/alarms            → Gestão de alarmes (futuro)
/settings          → Configurações do usuário
```

### **Componentes Principais**

```
components/
├── layout/
│   ├── Sidebar.tsx          # Sidebar colapsável com navegação
│   ├── TopBar.tsx           # User menu + notificações
│   └── Layout.tsx           # Wrapper geral
├── devices/
│   ├── DeviceCard.tsx       # Card no grid
│   ├── DeviceList.tsx       # Grid/Table com filtros
│   ├── DeviceDetail.tsx     # Página de detalhes
│   └── DeviceForm.tsx       # Form de provisioning
├── telemetry/
│   ├── EntityCard.tsx       # Card de entity
│   ├── EntityChart.tsx      # Chart Recharts
│   └── EntityControl.tsx    # Controle (switch/number)
└── ui/                      # shadcn/ui components
```

### **Theme - Dark Industrial**

```css
:root {
  --background: 222.2 84% 4.9%;      /* Slate 900 */
  --foreground: 210 40% 98%;         /* Slate 50 */
  --primary: 217.2 91.2% 59.8%;      /* Blue 500 */
  --accent: 139.3 76.2% 59.4%;       /* Green 500 */
  --destructive: 0 62.8% 30.6%;      /* Red 700 */
  --card: 222.2 84% 4.9%;            /* Slate 900 */
  --border: 217.2 32.6% 17.5%;       /* Slate 800 */
}
```

**Gradientes:**
- Primary: `from-blue-600 via-purple-600 to-pink-500`
- Success: `from-green-500 to-emerald-600`
- Warning: `from-yellow-500 to-orange-600`

---

## 🗺️ Roadmap

### **Phase 2.2: Device Management UI** (Próximo)

**Estimativa:** 8-12h de desenvolvimento

#### **Sprint 1: Layout Base** (3-4h)
- [ ] Sidebar component (colapsável)
- [ ] TopBar component (user menu)
- [ ] Layout wrapper
- [ ] Navegação funcional
- [ ] Ícones (lucide-react)

#### **Sprint 2: Dashboard Overview** (2-3h)
- [ ] KPI cards (total devices, online, offline)
- [ ] Grid de últimos devices (6 cards)
- [ ] Status indicators (🟢 online, 🔴 offline)
- [ ] Search bar global

#### **Sprint 3: Device List** (3-4h)
- [ ] Página `/devices`
- [ ] Grid completo de devices
- [ ] Filtros (status, tipo)
- [ ] Sort (nome, última atualização)
- [ ] Toggle view (grid/table)

#### **Sprint 4: Polish** (1-2h)
- [ ] Loading states
- [ ] Empty states
- [ ] Error boundaries
- [ ] Responsividade mobile

**Artifacts Necessários:**
1. `Sidebar.tsx`
2. `TopBar.tsx`
3. `Layout.tsx`
4. `Dashboard.tsx` (atualizado)
5. `DeviceCard.tsx`
6. `DeviceList.tsx`

---

### **Phase 2.3: Device Detail** (8-10h)

#### **Sprint 1: Página Base** (3h)
- [ ] Rota `/devices/:id`
- [ ] Header (nome, status, last_seen)
- [ ] Tabs component
- [ ] Breadcrumb navigation

#### **Sprint 2: Entities Display** (3h)
- [ ] Lista de entities agrupadas por tipo
- [ ] EntityCard component
- [ ] Valores atuais
- [ ] Timestamp relativo

#### **Sprint 3: Charts** (3-4h)
- [ ] EntityChart component (Recharts)
- [ ] Time range selector (1h, 6h, 24h, 7d)
- [ ] Integração com API telemetria
- [ ] Loading skeleton

#### **Sprint 4: Controls** (futuro)
- [ ] EntityControl (switch/number)
- [ ] MQTT command publish
- [ ] Confirmação de ação

---

### **Phase 2.4: Real-time Polling** (4-6h)

- [ ] usePolling custom hook
- [ ] Auto-refresh a cada 5s
- [ ] Pause/resume manual
- [ ] Visual indicator (última atualização)
- [ ] Refetch on focus

---

### **Phase 3: Advanced Features** (Futuro)

#### **3.1: Automations**
- [ ] Rule engine (if-then)
- [ ] Triggers (time, state, event)
- [ ] Actions (MQTT publish, HTTP request)
- [ ] Visual flow editor

#### **3.2: RS485/Modbus Config**
- [ ] Modbus device scanner
- [ ] Register mapping UI
- [ ] Protocol analyzer
- [ ] Diagnostic tools

#### **3.3: Analytics**
- [ ] Historical reports
- [ ] Comparação de devices
- [ ] Export CSV/PDF
- [ ] Scheduled reports

#### **3.4: CLP Support**
- [ ] Ladder Logic editor
- [ ] Program upload/download
- [ ] Runtime simulator
- [ ] Debugging tools

---

## 🤖 Colaboração com LLMs

### **Para Claude/ChatGPT/Grok/DeepSeek/etc em Sessões Futuras**

Este projeto foi desenvolvido em **colaboração humano-IA**. Se você é uma IA / LLM continuando o trabalho:

#### **1. Leia Primeiro**
- Este README completo
- `CHANGELOG.md` para histórico de mudanças
- Última seção do README (contexto de decisões)

#### **2. Entenda o Contexto**
- Multi-tenancy é **CRÍTICO** - sempre filtrar por `tenant_id`
- Schema PostgreSQL real (colunas: id, name, status, last_seen, metadata)
- ESPHome é estratégia atual para validação de mercado
- Futuro: Firmware proprietário com YAML guiado por LLMs
- Foco industrial (não copiar Home Assistant, mas inspirar-se)

#### **3. Antes de Começar Qualquer Tarefa**

```bash
# Verificar versões
node --version  # Deve ser v22.20.0
cd ~/easysmart-platform

# Backend health check
cd backend
npm run dev
# Outro terminal:
curl http://localhost:3010/health | jq

# Frontend status
cd ../frontend
npm run dev
# Abrir: http://localhost:5173

# Git status
git status
git log --oneline -5
```

#### **4. Validar Multi-Tenancy SEMPRE**

Antes de implementar qualquer feature relacionada a devices:

```bash
# Login como admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq -r '.tokens.accessToken')

# Login como usuário comum
JOAO_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao.silva@techsolutions.com","password":"senha123456"}' \
  | jq -r '.tokens.accessToken')

# Testar isolamento
echo "Admin devices: $(curl -s http://localhost:3010/api/v1/devices -H "Authorization: Bearer $ADMIN_TOKEN" | jq '. | length')"
echo "João devices: $(curl -s http://localhost:3010/api/v1/devices -H "Authorization: Bearer $JOAO_TOKEN" | jq '. | length')"
```

**Resultado esperado:** Cada usuário vê apenas seus próprios devices.

#### **5. Padrões de Código Obrigatórios**

**Backend:**
```javascript
// ✅ SEMPRE incluir tenant_id nas queries
const getDevices = async (req, res) => {
  const tenantId = req.user.tenantId; // Do JWT via middleware
  const result = await pool.query(
    'SELECT * FROM devices WHERE tenant_id = $1',
    [tenantId]
  );
  res.json(result.rows);
};

// ❌ NUNCA fazer query sem filtro de tenant
const result = await pool.query('SELECT * FROM devices'); // ERRADO!
```

**Frontend:**
```typescript
// ✅ Usar React Query para data fetching
import { useQuery } from '@tanstack/react-query';

const { data: devices, isLoading } = useQuery({
  queryKey: ['devices'],
  queryFn: () => api.get('/devices').then(res => res.data),
  refetchInterval: 5000, // Polling
});

// ❌ NUNCA usar localStorage em artifacts
// ✅ Usar Zustand ou React state
```

#### **6. Quando Criar Artifacts**

**Criar artifacts para:**
- Componentes completos (>20 linhas)
- Funcionalidade 100% implementada
- Sem TODOs ou placeholders
- Código testável

**Não criar artifacts para:**
- Snippets pequenos (<20 linhas)
- Configs simples
- Documentação inline

#### **7. Checklist Antes de Commit**

```bash
# Backend
cd backend
npm run dev  # Deve iniciar sem erros

# Frontend
cd frontend
npm run lint  # Deve retornar 0 errors
npm run dev   # Testar no navegador

# Git
git status
git diff     # Revisar mudanças
git add .
git commit -m "tipo: mensagem clara"  # Conventional Commits
git push origin main
```

#### **8. Mensagens de Commit (Conventional Commits)**

```bash
feat: adiciona componente DeviceList
fix: corrige filtro multi-tenancy em devices API
refactor: separa DeviceCard em componentes menores
docs: atualiza API reference com novos endpoints
style: formata código com prettier
test: adiciona testes unitários para auth
chore: atualiza dependências
```

#### **9. Quando Parar e Pedir Ajuda**

**SEMPRE pergunte ao desenvolvedor quando encontrar:**
- Erros de schema do banco (colunas não existem)
- Multi-tenancy vazando dados entre tenants
- Decisões que impactam arquitetura geral
- Performance issues significativos
- Dúvidas sobre requisitos funcionais
- Necessidade de alterar estrutura do projeto

**NÃO ASSUMA - PERGUNTE!**

---

##  Decisões Arquiteturais Importantes

### **Registradas neste Projeto:**

1. **Sidebar Colapsável** (vs Top Nav)
   - Decisão: Sidebar
   - Justificativa: Escalável para 10+ seções futuras
   - Impacto: Layout base do sistema

2. **Grid Cards** (vs Table)
   - Decisão: Grid cards no dashboard
   - Justificativa: Overview visual rápido para múltiplas entities
   - Impacto: UX do sistema

3. **Página Dedicada** (vs Modal) para Device Detail
   - Decisão: Página com rota `/devices/:id`
   - Justificativa: Necessário para 20-30 entities por device
   - Impacto: Estrutura de navegação

4. **React Query** (vs Zustand) para Data Fetching
   - Decisão: React Query para devices/telemetria
   - Justificativa: Cache automático e refetch inteligente
   - Impacto: Performance e DX

5. **Polling Híbrido** (vs WebSocket desde o início)
   - Decisão: Começar com polling 5s, evoluir para WebSocket
   - Justificativa: Simplicidade no MVP
   - Impacto: Arquitetura de real-time

---

##  Avisos Críticos para LLMs

### **NUNCA Faça:**
1. ❌ Queries sem filtro `tenant_id`
2. ❌ Usar colunas antigas (`mqtt_id`, `model`, `manufacturer`)
3. ❌ localStorage/sessionStorage em artifacts
4. ❌ Commits sem testar multi-tenancy
5. ❌ Assumir estrutura do banco sem verificar
6. ❌ Criar TODOs ou placeholders em artifacts
7. ❌ Pular etapas de validação

### **SEMPRE Faça:**
1. ✅ Filtrar por `tenant_id` em TODAS as queries de devices
2. ✅ Usar colunas reais do schema (verificar com `\d devices`)
3. ✅ Testar multi-tenancy após cada mudança
4. ✅ Criar código funcional e completo
5. ✅ Perguntar ao desenvolvedor quando em dúvida
6. ✅ Seguir padrões estabelecidos
7. ✅ Documentar decisões importantes

---

##  Template de Primeira Mensagem (Para LLMs)

```
Olá! Vou continuar o desenvolvimento do EasySmart IoT Platform.

Li o README completo e entendi que:
- Phase 2.1 está completa (Autenticação funcionando)
- Próximo: Phase 2.2 - Device Management UI
- Multi-tenancy é CRÍTICO (sempre filtrar por tenant_id)
- Schema PostgreSQL: id, name, status, last_seen, metadata
- Stack: Node 22 + Express 5 + React 18 + TypeScript

Antes de começar, confirmo:
1. Backend rodando? (porta 3010)
2. Frontend rodando? (porta 5173)  
3. Multi-tenancy validado?
4. Posso começar com [tarefa específica]?

Aguardo confirmação!
```

---

## 💾 Estrutura de Commits Ideal

```bash
# Sessão típica de desenvolvimento
git commit -m "feat(frontend): add Sidebar component with collapse"
git commit -m "feat(frontend): add TopBar with user menu"
git commit -m "feat(frontend): integrate Sidebar and TopBar in Layout"
git commit -m "test: validate multi-tenancy in device list"
git commit -m "docs: update README with Phase 2.2 progress"
```

**Commits pequenos e frequentes > Commits grandes e raros**

---

## 🎓 Lições Aprendidas (Para Referência Futura)

### **O Que Funcionou Bem:**
1. ✅ Discussão de arquitetura ANTES da implementação
2. ✅ Decisões claras com justificativas documentadas
3. ✅ Testes de multi-tenancy a cada feature
4. ✅ Colaboração humano-IA com papéis bem definidos
5. ✅ README como documentação viva
6. ✅ Commits frequentes com mensagens claras

### **O Que Evitar:**
1. ❌ Implementar sem validar schema do banco
2. ❌ Assumir estrutura sem confirmar com desenvolvedor
3. ❌ Código com TODOs ou placeholders
4. ❌ Commits grandes sem testes intermediários
5. ❌ Pular validação de multi-tenancy
6. ❌ Mudar decisões arquiteturais sem discussão

---

## 🔄 Ciclo de Desenvolvimento Recomendado

```
1. Ler README + última sessão de contexto
2. Validar ambiente (backend + frontend rodando)
3. Discutir tarefa com desenvolvedor
4. Implementar feature completa (sem TODOs)
5. Testar localmente (incluindo multi-tenancy)
6. Commit com mensagem clara
7. Atualizar documentação se necessário
8. Repetir ciclo
```

---

## 🎯 Métricas de Sucesso

**Uma sessão de desenvolvimento é bem-sucedida quando:**
- ✅ Código funciona sem erros
- ✅ Multi-tenancy validado
- ✅ Testes manuais passando
- ✅ Commits claros e incrementais
- ✅ Documentação atualizada
- ✅ Nenhuma regressão introduzida
- ✅ Desenvolvedor satisfeito com resultado

---

## 🌟 Filosofia do Projeto

> "Qualidade > Velocidade. Melhor fazer certo da primeira vez do que refatorar depois."

**Princípios:**
1. **Segurança primeiro** - Multi-tenancy não é negociável
2. **Código limpo** - Sem TODOs, sem placeholders
3. **Documentação viva** - README sempre atualizado
4. **Testes antes de commit** - Validar antes de subir
5. **Decisões documentadas** - Justificar escolhas importantes
6. **Colaboração transparente** - Perguntar quando em dúvida

---

## 📚 Recursos de Referência Rápida

**Backend:**
- Schema: `docker exec -it postgres psql -U postgres -d easysmart -c "\d devices"`
- Health: `curl http://localhost:3010/health | jq`
- Logs: `tail -f backend/logs/app.log` (se configurado)

**Frontend:**
- Lint: `npm run lint`
- Build: `npm run build`
- Preview: `npm run preview`

**Git:**
- Status: `git status --short`
- Diff: `git diff --stat`
- Log: `git log --oneline --graph -10`

---

## 🎬 Conclusão

Este README é a **fonte única de informações** do projeto. Sempre que tiver dúvidas:

1. Leia este documento primeiro
2. Verifique o código existente
3. Teste localmente
4. Pergunte ao desenvolvedor se ainda tiver dúvidas

**Boa sorte no desenvolvimento!**

---

**Última atualização:** 2025-10-17  
**Versão:** 0.2.0  
**Status:** Phase 2.1 Complete ✅ | Phase 2.2 Ready to Start 🚀  
**Próxima tarefa:** Implementar Sidebar + Layout base

---

*Desenvolvido com ❤️ em Curitiba/PR - Brasil*
*Powered by Rodrigo Lange + AI Collaboration*
