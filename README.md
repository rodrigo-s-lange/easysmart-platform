# EasySmart IoT Platform - Projeto em construção

**Última atualização:** 2025-10-18 11h30am 
**Versão:** 0.3.0  

> **Plataforma IoT Industrial Multi-Tenant para Automação e Monitoramento**

![Version](https://img.shields.io/badge/version-0.3.0-blue)
![Node](https://img.shields.io/badge/node-22.20.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Status do Projeto](#status-do-projeto)
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Sistema de Roles](#sistema-de-roles)
- [Setup e Instalação](#setup-e-instalação)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [MQTT Topics](#mqtt-topics)
- [Frontend Architecture](#frontend-architecture)
- [Roadmap](#roadmap)
- [Colaboração com LLMs](#colaboração-com-llms)
- [Troubleshooting](#troubleshooting)
- [Recursos Adicionais](#recursos-adicionais)
- [Contexto Industrial](#contexto-industrial)
- [Segurança](#segurança)
- [Performance](#performance)
- [Contribuindo](#contribuindo)
- [Licença](#licença)
- [Contato](#contato)

---

## 🎯 Visão Geral

EasySmart é uma plataforma IoT industrial multi-tenant focada em:
- **Monitoramento em tempo real** via RS485/Modbus
- **Integração ESPHome** (ESP32/ESP32-S3)
- **Integração Proprietária** (ESP32/ESP32-S3/STM32Hxxx/RP2040/CNC/3D_PRINT/etc)
- **Dashboards SCADA-like** para análise de dados
- **Multi-tenancy** com isolamento total de dados e segurança reforçada
- **Admin Panel** para gestão de clientes e plataforma
- **Futuro:** Suporte a CLPs e linguagem proprietária YAML auxiliada por LLMs

### 🎨 Filosofia de Design
- **Não copiar Home Assistant** (mas basear-se no mesmo conceito)
- **Inspiração:** Vercel, Linear, Grafana, Notion
- **Foco:** Dashboards profissionais para ambiente industrial

---

## 📊 Status do Projeto

### ✅ Concluído (v0.2.1)

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

### ✅ Concluído Recentemente

#### **Phase 2.1.5: Role System & Admin Base** ✅ (Concluído: 2025-10-18)

**Sprint 1: Backend - Roles** ✅
- [x] Sistema de roles (super_admin, tenant_admin, user)
- [x] Migration add role column
- [x] Middleware requireSuperAdmin
- [x] AuthController atualizado (role no JWT)
- [x] Endpoint /users/me
- [x] Testes validados

**Sprint 2: Admin Routes** ✅
- [x] AdminController completo (5 endpoints)
- [x] GET /admin/tenants (lista com métricas)
- [x] GET /admin/tenants/:id (detalhes)
- [x] POST /admin/tenants/:id/impersonate (suporte)
- [x] GET /admin/devices (cross-tenant)
- [x] GET /admin/metrics (métricas plataforma)
- [x] Testes automatizados (6/6 passing)
- [x] Multi-tenancy isolamento validado

### 🚧 Próximo

#### **Phase 2.2: Device Management UI** (8-10h)
- [ ] Sidebar navigation (colapsável + roles)
- [ ] Dashboard adaptativo (mobile + desktop)
- [ ] Device list (grid cards responsivo)
- [ ] Entity modal com gráfico temporal
- [ ] Export CSV de telemetria

#### **Phase 2.3: Admin Panel UI** (Depois - 6-8h)
- [ ] Gestão de Tenants
- [ ] View Global de Devices (cross-tenant)
- [ ] Métricas agregadas da plataforma
- [ ] Impersonate UI

---

## 🏗️ Arquitetura

```
┌───────────────────────────────────────────────────────┐
│                     FRONTEND (React)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Dashboard  │  │   Devices   │  │Admin Panel  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│         │ HTTP (Axios + React Query) │                │
└─────────┼─────────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Auth   │  │  Device  │  │  Admin   │             │
│  │   API    │  │   API    │  │   API    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│         │              │              │               │
└─────────┼──────────────┼──────────────┼───────────────┘
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

### 🔐 Multi-Tenancy

**Row-Level Security:**
```sql
-- Todos os devices pertencem a um tenant
SELECT * FROM devices WHERE tenant_id = $current_user_tenant_id
```

**JWT Payload:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "role": "super_admin",
  "iat": 1234567890,
  "exp": 1234568790
}
```

---

## 🛠️ Stack Tecnológica

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

## 🔐 Sistema de Roles

### **Níveis de Acesso**

#### **1. SUPER_ADMIN (Você - EasySmart)**
- ✅ Acessa **TODOS** os tenants
- ✅ Gerencia tenants e usuários
- ✅ Vê métricas globais da plataforma
- ✅ Pode "impersonate" qualquer tenant para suporte
- ✅ Acesso exclusivo ao Admin Panel

#### **2. TENANT_ADMIN (Cliente)**
- ✅ Acessa apenas **SEU** tenant
- ✅ Gerencia devices do tenant
- ✅ Gerencia usuários do tenant
- ✅ Vê métricas do tenant
- ❌ Sem acesso ao Admin Panel

#### **3. USER (Usuário do Cliente)**
- ✅ Acessa apenas **SEU** tenant
- ✅ View-only ou permissões limitadas
- ❌ Não gerencia usuários
- ❌ Sem acesso ao Admin Panel

### **Database Schema - Roles**

```sql
-- Coluna role em users
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Valores possíveis:
-- 'super_admin' → Administrador da plataforma
-- 'tenant_admin' → Administrador do tenant
-- 'user' → Usuário comum
```

---

## 🚀 Setup e Instalação

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

# Editar credenciais
nano .env

# Rodar migrations
npm run migrate up

# Iniciar servidor
npm run dev
```

**Backend roda em:** `http://localhost:3010`  
_Nota: Porta 3010 evita conflito com VSCode (padrão seria 3001)_

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

---

## 📡 Authentication

### `POST /auth/register`
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
    "tenant_id": "uuid",
    "role": "tenant_admin"
  },
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "rt_..."
  }
}
```

### `POST /auth/login`
Autenticação de usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "senha123456"
}
```

### `POST /auth/refresh`
Renova access token.

**Body:**
```json
{
  "refreshToken": "rt_..."
}
```

### `POST /auth/logout`
Invalida refresh token.

**Headers:** `Authorization: Bearer {accessToken}`

---

## 🔌 Devices API

**Todas as rotas requerem:** `Authorization: Bearer {accessToken}`

### `GET /devices`
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

### `GET /devices/:id`
Detalhes de um device específico.

### `GET /devices/:id/entities`
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

### `POST /devices/provision`
Cria novo device.

**Body:**
```json
{
  "name": "Sensor 1",
  "metadata": {
    "location": "sala"
  }
}
```

### `DELETE /devices/:id`
Remove device (e suas entities em cascata).

---

## 🔧 Admin API (SUPER_ADMIN apenas)

📖 Admin API - Guia de Uso Completo
🎯 Visão Geral
As rotas administrativas são protegidas e requerem:

✅ Autenticação válida (JWT token)
✅ Role super_admin

Base URL: http://localhost:3010/api/v1/admin

🔐 Autenticação
Todas as requisições devem incluir o header de autorização:
bashAuthorization: Bearer {accessToken}
Exemplo de obtenção do token:
bash# Login como super_admin
TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq -r '.tokens.accessToken')

# Usar token nas requisições admin
curl -H "Authorization: Bearer $TOKEN" http://localhost:3010/api/v1/admin/tenants

📋 1. GET /admin/tenants
Descrição: Lista todos os tenants da plataforma com métricas agregadas.
Método: GET
URL: /api/v1/admin/tenants
Auth: Requer super_admin
Response:
json{
  "tenants": [
    {
      "id": "uuid",
      "name": "Tech Solutions Ltda",
      "created_at": "2025-10-17T12:00:00Z",
      "user_count": "2",
      "device_count": "5",
      "status": "active"
    },
    {
      "id": "uuid",
      "name": "Indústria XYZ",
      "created_at": "2025-10-16T08:30:00Z",
      "user_count": "1",
      "device_count": "0",
      "status": "inactive"
    }
  ],
  "total": 2
}
Status do Tenant:

active: Possui devices cadastrados
inactive: Sem devices cadastrados

Exemplo cURL:
bashcurl -X GET http://localhost:3010/api/v1/admin/tenants \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

📊 2. GET /admin/tenants/:id
Descrição: Detalhes completos de um tenant específico incluindo usuários, devices e métricas.
Método: GET
URL: /api/v1/admin/tenants/{tenant_id}
Auth: Requer super_admin
Response:
json{
  "tenant": {
    "id": "uuid",
    "name": "Tech Solutions Ltda",
    "created_at": "2025-10-17T12:00:00Z",
    "user_count": 2,
    "device_count": 5
  },
  "users": [
    {
      "id": "uuid",
      "email": "admin@techsolutions.com",
      "role": "tenant_admin",
      "created_at": "2025-10-17T12:00:00Z"
    },
    {
      "id": "uuid",
      "email": "operator@techsolutions.com",
      "role": "user",
      "created_at": "2025-10-17T14:30:00Z"
    }
  ],
  "devices": [
    {
      "id": "uuid",
      "name": "Sensor Caldeira 1",
      "status": "online",
      "last_seen": "2025-10-18T10:00:00Z",
      "created_at": "2025-10-17T13:00:00Z",
      "entity_count": "3"
    }
  ],
  "metrics": {
    "total_devices": "5",
    "online_devices": "3",
    "total_entities": "15"
  }
}
Exemplo cURL:
bashTENANT_ID="seu-tenant-id-aqui"
curl -X GET "http://localhost:3010/api/v1/admin/tenants/$TENANT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

🎭 3. POST /admin/tenants/:id/impersonate
Descrição: Gera tokens para "logar como" um tenant específico (recurso de suporte técnico).
Método: POST
URL: /api/v1/admin/tenants/{tenant_id}/impersonate
Auth: Requer super_admin
Body:
json{
  "reason": "Suporte técnico - debug de sensores offline"
}
Validações:

✅ reason é obrigatório
✅ Mínimo de 10 caracteres
✅ Tenant deve ter pelo menos 1 tenant_admin

Response:
json{
  "message": "Impersonate realizado com sucesso",
  "tenant": {
    "id": "uuid",
    "name": "Tech Solutions Ltda"
  },
  "user": {
    "id": "uuid",
    "email": "admin@techsolutions.com",
    "role": "tenant_admin"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "rt_..."
  },
  "expires_in": "15m",
  "warning": "Use apenas para suporte técnico. Todas ações são auditadas."
}
Auditoria:
Todas ações de impersonate são registradas nos logs com:

ID do super_admin
Email do super_admin
Tenant alvo
Usuário impersonado
Motivo fornecido
Timestamp

Exemplo cURL:
bashTENANT_ID="seu-tenant-id-aqui"
curl -X POST "http://localhost:3010/api/v1/admin/tenants/$TENANT_ID/impersonate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Suporte técnico - verificar configuração de sensores"
  }' \
  | jq '.'

# Usar tokens retornados para acessar como tenant
TENANT_TOKEN=$(echo $RESPONSE | jq -r '.tokens.accessToken')
curl -H "Authorization: Bearer $TENANT_TOKEN" http://localhost:3010/api/v1/devices

🔌 4. GET /admin/devices
Descrição: Lista TODOS os devices de TODOS os tenants (visão cross-tenant).
Método: GET
URL: /api/v1/admin/devices
Auth: Requer super_admin
Query Parameters:
ParâmetroTipoObrigatórioDescriçãoValorestenant_idUUIDNãoFiltrar por tenant específicoUUID do tenantstatusStringNãoFiltrar por statusonline, offline, unclaimed, alllimitIntegerNãoItens por páginaPadrão: 50, Max: 100offsetIntegerNãoPaginaçãoPadrão: 0
Response:
json{
  "devices": [
    {
      "id": "uuid",
      "name": "Sensor Caldeira 1",
      "status": "online",
      "last_seen": "2025-10-18T10:00:00Z",
      "created_at": "2025-10-17T13:00:00Z",
      "tenant_id": "uuid",
      "tenant_name": "Tech Solutions Ltda",
      "entity_count": "3"
    }
  ],
  "pagination": {
    "total": 127,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
Exemplos cURL:
bash# Listar todos devices (primeira página)
curl -X GET "http://localhost:3010/api/v1/admin/devices?limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

# Filtrar por tenant
curl -X GET "http://localhost:3010/api/v1/admin/devices?tenant_id=$TENANT_ID&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

# Filtrar apenas devices online
curl -X GET "http://localhost:3010/api/v1/admin/devices?status=online&limit=50" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

# Paginação (próxima página)
curl -X GET "http://localhost:3010/api/v1/admin/devices?limit=50&offset=50" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

📊 5. GET /admin/metrics
Descrição: Métricas agregadas de toda a plataforma.
Método: GET
URL: /api/v1/admin/metrics
Auth: Requer super_admin
Response:
json{
  "platform": {
    "total_tenants": 15,
    "new_tenants_30d": 3,
    "total_users": 38,
    "new_users_30d": 7,
    "total_devices": 127,
    "online_devices": 98,
    "new_devices_30d": 15,
    "active_devices_24h": 92
  },
  "users": {
    "total": 38,
    "super_admins": 1,
    "tenant_admins": 15,
    "regular_users": 22
  },
  "devices": {
    "total": 127,
    "online": 98,
    "offline": 27,
    "unclaimed": 2
  },
  "entities": {
    "total": 384,
    "devices_with_entities": 125,
    "sensors": 320,
    "switches": 45,
    "binary_sensors": 19
  },
  "activity": {
    "active_sessions": 42,
    "logins_24h": 18
  },
  "timestamp": "2025-10-18T10:48:25.193Z"
}
Métricas Incluídas:
Platform:

total_tenants: Total de tenants cadastrados
new_tenants_30d: Novos tenants nos últimos 30 dias
total_users: Total de usuários na plataforma
new_users_30d: Novos usuários nos últimos 30 dias
total_devices: Total de devices cadastrados
online_devices: Devices atualmente online
new_devices_30d: Novos devices nos últimos 30 dias
active_devices_24h: Devices que enviaram dados nas últimas 24h

Users:

Distribuição por role (super_admins, tenant_admins, regular_users)

Devices:

Distribuição por status (online, offline, unclaimed)

Entities:

Total de entities
Devices com entities configuradas
Distribuição por tipo (sensors, switches, binary_sensors)

Activity:

active_sessions: Sessões ativas (refresh tokens válidos)
logins_24h: Logins nas últimas 24 horas

Exemplo cURL:
bashcurl -X GET http://localhost:3010/api/v1/admin/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

🔒 Segurança e Controle de Acesso
Middleware requireSuperAdmin
Todas as rotas admin são protegidas pelo middleware requireSuperAdmin:
Fluxo de Validação:
1. Request chega no endpoint /admin/*
   ↓
2. Middleware requireAuth valida JWT
   ↓
3. Middleware requireSuperAdmin verifica role
   ↓
4. Se role != 'super_admin' → 403 Forbidden
   ↓
5. Se role == 'super_admin' → Acesso permitido
Response de Acesso Negado:
json{
  "error": "Access denied. Super admin privileges required.",
  "requiredRole": "super_admin",
  "currentRole": "tenant_admin"
}
Auditoria
Todas ações admin são registradas nos logs estruturados:
Login como super_admin:
json{
  "level": "info",
  "msg": "Login realizado",
  "userId": "uuid",
  "email": "admin@easysmart.io",
  "role": "super_admin"
}
Tentativa de acesso não autorizado:
json{
  "level": "warn",
  "msg": "Unauthorized admin access attempt",
  "userId": "uuid",
  "userRole": "tenant_admin",
  "tenantId": "uuid",
  "path": "/api/v1/admin/tenants",
  "method": "GET"
}
Impersonate (CRÍTICO):
json{
  "level": "warn",
  "msg": "Impersonate realizado",
  "adminUserId": "uuid",
  "adminEmail": "admin@easysmart.io",
  "targetTenantId": "uuid",
  "targetTenantName": "Tech Solutions Ltda",
  "targetUserId": "uuid",
  "targetUserEmail": "admin@techsolutions.com",
  "reason": "Suporte técnico - debug de sensores",
  "timestamp": "2025-10-18T10:30:00Z"
}

🧪 Testes Automatizados
Script: backend/test-admin-routes.sh
Execute todos os testes:
bashchmod +x ~/easysmart-platform/backend/test-admin-routes.sh
~/easysmart-platform/backend/test-admin-routes.sh
Testes Incluídos:

✅ Obtenção de token super_admin
✅ GET /admin/tenants
✅ GET /admin/tenants/:id
✅ GET /admin/devices (com filtros)
✅ GET /admin/metrics
✅ Bloqueio de acesso (tenant_admin)
✅ POST /admin/tenants/:id/impersonate

Output Esperado:
==========================================
🧪 Testes - Admin Routes (Sprint 2)
==========================================

✅ Token obtido (role: super_admin)
✅ Tenants listados: 4 tenants
✅ Detalhes do tenant obtidos
✅ Devices listados: 25 devices
✅ Métricas da plataforma obtidas
✅ Acesso bloqueado corretamente
✅ Impersonate realizado com sucesso

==========================================
✅ Testes Concluídos!
==========================================

💡 Casos de Uso Práticos
1. Monitorar Crescimento da Plataforma
bash# Ver métricas gerais
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3010/api/v1/admin/metrics | jq '.platform'

# Output: total_tenants, new_tenants_30d, total_devices, etc.
2. Investigar Tenant com Problemas
bash# Listar todos tenants
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3010/api/v1/admin/tenants | jq '.tenants[] | {id, name, device_count}'

# Ver detalhes do tenant problemático
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3010/api/v1/admin/tenants/$TENANT_ID | jq '.'

# Impersonate para debug
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Debug: devices offline há 3 dias"}' \
  http://localhost:3010/api/v1/admin/tenants/$TENANT_ID/impersonate
3. Análise de Dispositivos Cross-Tenant
bash# Ver todos devices online
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3010/api/v1/admin/devices?status=online&limit=100" \
  | jq '.devices[] | {name, tenant_name, last_seen}'

# Devices offline de um tenant específico
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3010/api/v1/admin/devices?tenant_id=$TENANT_ID&status=offline" \
  | jq '.'
4. Auditoria de Usuários
bash# Ver distribuição de roles
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3010/api/v1/admin/metrics | jq '.users'

# Listar usuários de um tenant
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3010/api/v1/admin/tenants/$TENANT_ID | jq '.users'

⚠️ Boas Práticas
✅ DO (Faça)

✅ Use impersonate apenas para suporte técnico
✅ Sempre forneça um motivo descritivo no impersonate
✅ Revise logs de auditoria regularmente
✅ Use filtros e paginação em listas grandes
✅ Valide tokens antes de operações críticas

❌ DON'T (Não Faça)

❌ Compartilhe credenciais de super_admin
❌ Use impersonate para operações rotineiras
❌ Ignore avisos de acesso não autorizado nos logs
❌ Faça requests sem paginação em produção
❌ Armazene tokens em logs ou arquivos de texto


🔗 Endpoints Relacionados
Autenticação:

POST /api/v1/auth/login - Obter tokens
POST /api/v1/auth/refresh - Renovar access token
GET /api/v1/auth/users/me - Verificar role atual

Devices (Tenant):

GET /api/v1/devices - Devices do tenant autenticado
GET /api/v1/devices/:id - Detalhes do device

Telemetria:

GET /api/v1/telemetry/:deviceId/:entityId - Dados time-series


📚 Documentação Adicional

README.md - Documentação completa do projeto
CHANGELOG.md - Histórico de mudanças
API Reference - Todos endpoints


Última atualização: 2025-10-18
Versão da API: v1
Status: Production Ready ✅

## 📡 MQTT Topics

### **Discovery**
**Topic:** `easysmart/{device_id}/discovery`

**Payload:**
```json
{
  "device": {
    "id": "esp32-lab",
    "name": "Lab Sensor"
  },
  "entities": [
    {
      "type": "sensor",
      "id": "temperature",
      "unit_of_measurement": "°C"
    }
  ]
}
```

### **Telemetria**

**Sensor:** `easysmart/{device_id}/sensor/{entity_id}/state`
```json
{"value": 23.5, "unit": "°C"}
```

**Switch:** `easysmart/{device_id}/switch/{entity_id}/state`
```
"ON" ou "OFF"
```

---

## 🎨 Frontend Architecture

### **Rotas**

```typescript
// Públicas
/login
/register

// Protegidas (Authenticated)
/dashboard           → Overview + KPIs
/devices             → Lista de devices
/devices/:id         → Detalhes + entities + charts

// Admin (SUPER_ADMIN apenas)
/admin               → Admin dashboard
/admin/tenants       → Gestão de tenants
/admin/tenants/:id   → Detalhes do tenant
/admin/devices       → View global de devices
/admin/metrics       → Métricas da plataforma
```

### **Sidebar Navigation**

```
🏠 Dashboard
🔌 Devices
📊 Analytics

─────────────────

🔧 Admin Panel (super_admin only)
  ├─ Tenants
  ├─ All Devices
  └─ Metrics

─────────────────

⚙️ Settings
```

### **Dashboard Responsivo**

**Desktop:**
- 4 KPI cards
- Grid 3 colunas de devices

**Tablet:**
- 3 KPI cards
- Grid 2 colunas

**Mobile:**
- 3 KPI cards compactos
- Grid 1 coluna (lista)

### **Entity Modal + Chart**

Click em entity abre modal com:
- Gráfico temporal (Recharts)
- Time range selector (1h, 6h, 24h, 7d, 30d)
- **Export CSV** com todos dados do período
- Export PNG (opcional)

**CSV Format:**
```csv
timestamp,value,unit,device_id,entity_id
2025-10-17T00:00:00Z,18.2,°C,esp32-lab,temperature
...
```

---

## 🗺️ Roadmap

### **Phase 2.1.5: Role System & Admin Base** (Agora - 4-6h)

**Sprint 1: Backend - Roles** (2h)
- [ ] Migration: adicionar coluna `role`
- [ ] Atualizar authController (JWT com role)
- [ ] Middleware `requireSuperAdmin`
- [ ] Seed: criar super_admin

**Sprint 2: Admin Routes** (2h)
- [ ] GET /admin/tenants
- [ ] GET /admin/tenants/:id
- [ ] POST /admin/tenants/:id/impersonate
- [ ] GET /admin/devices
- [ ] GET /admin/metrics

**Sprint 3: Frontend - Admin Guard** (1h)
- [ ] Atualizar authStore (role)
- [ ] AdminRoute component
- [ ] Sidebar com Admin Panel (condicional)

**Sprint 4: Validação** (1h)
- [ ] Testar roles
- [ ] Validar isolamento
- [ ] Commit + docs

---

### **Phase 2.2: Device Management UI** (8-10h)

**Sprint 1: Layout** (3h)
- [ ] Sidebar colapsável
- [ ] TopBar
- [ ] Layout wrapper

**Sprint 2: Dashboard** (2h)
- [ ] KPI cards responsivos
- [ ] Device grid adaptativo

**Sprint 3: Device List** (3h)
- [ ] Página /devices
- [ ] Filtros e busca
- [ ] Device cards

**Sprint 4: Entity Modal** (2-3h)
- [ ] Modal com chart
- [ ] Export CSV

---

### **Phase 2.3: Admin Panel UI** (6-8h)

**Sprint 1: Tenants** (3h)
- [ ] Lista de tenants
- [ ] Tenant detail
- [ ] Impersonate button

**Sprint 2: Devices** (2h)
- [ ] Global device list
- [ ] Filtros cross-tenant

**Sprint 3: Metrics** (2h)
- [ ] Dashboard de métricas
- [ ] Charts agregados

---

## 🤖 Colaboração com LLMs

### **Para Claude/ChatGPT Continuando o Projeto**

**LEIA PRIMEIRO:**
- Este README completo
- CHANGELOG.md
- Última seção (contexto de decisões)

**ENTENDA:**
- Multi-tenancy é CRÍTICO (sempre filtrar por `tenant_id`)
- Schema PostgreSQL real (colunas: id, name, status, metadata)
- ESPHome é estratégia atual
- Foco industrial

**ANTES DE COMEÇAR:**
```bash
# Verificar ambiente
node --version  # v22.20.0
cd ~/easysmart-platform

# Backend
cd backend && npm run dev
curl http://localhost:3010/health | jq

# Frontend
cd frontend && npm run dev

# Git
git status
git log -1
```

**VALIDAR MULTI-TENANCY:**
```bash
# Login admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq -r '.tokens.accessToken')

# Testar isolamento
curl -s http://localhost:3010/api/v1/devices \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '. | length'
```

**PADRÕES DE CÓDIGO:**

Backend:
```javascript
// ✅ SEMPRE filtrar por tenant_id
const tenantId = req.user.tenantId;
const result = await pool.query(
  'SELECT * FROM devices WHERE tenant_id = $1',
  [tenantId]
);
```

Frontend:
```typescript
// ✅ Usar React Query
const { data } = useQuery({
  queryKey: ['devices'],
  queryFn: () => api.get('/devices').then(res => res.data)
});
```

**QUANDO PARAR E PERGUNTAR:**
- Erros de schema
- Multi-tenancy vazando dados
- Decisões arquiteturais
- Performance issues

**COMMITS:**
```bash
feat: adiciona role system
fix: corrige filtro multi-tenancy
docs: atualiza API reference
```

---

## 🐛 Troubleshooting

### **Backend não inicia**
```bash
cd ~/docker
docker ps
docker-compose up -d postgres influxdb mosquitto
```

### **Frontend: Cannot find module '@/...'**
```bash
# Verificar tsconfig.json paths
# Recarregar VSCode: Ctrl+Shift+P → Reload Window
```

### **Multi-tenancy vazando dados**
```bash
# Ver tenant_id dos devices
docker exec -it postgres psql -U postgres -d easysmart -c "
SELECT id, name, tenant_id FROM devices LIMIT 10;
"

# Adicionar filtro WHERE tenant_id = $1 em TODAS queries
```

---

## 📚 Recursos Adicionais

- **Express 5:** https://expressjs.com/
- **PostgreSQL 16:** https://www.postgresql.org/docs/16/
- **InfluxDB 2:** https://docs.influxdata.com/influxdb/v2/
- **React 18:** https://react.dev/
- **TailwindCSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com/
- **ESPHome:** https://esphome.io/

---

## 🏭 Contexto Industrial

### **Casos de Uso Target**

1. **Monitoramento de Caldeiras**
   - Sensores: Temperatura, Pressão, Nível
   - Protocolo: Modbus RTU via RS485
   - Devices: 3-20 sensores por caldeira

2. **Automação de Linha de Produção**
   - Sensores: Contadores, Encoders
   - Protocolo: Modbus TCP, CAN Bus
   - Devices: 50+ I/Os por linha

3. **Gestão de Energia**
   - Sensores: Medidores kWh, Corrente, Tensão
   - Protocolo: Modbus RTU/TCP
   - Devices: 3-50 pontos de medição

### **Diferencial Competitivo**

**vs Home Assistant/ESPHome:**
- ✅ Foco industrial
- ✅ Multi-tenancy (SaaS)
- ✅ Suporte RS485/Modbus/CAN

**vs Plataformas Industriais:**
- ✅ Open source
- ✅ Custo zero (self-hosted)
- ✅ API-first

**vs ThingsBoard/Losant:**
- ✅ Sem limites artificiais
- ✅ Código aberto
- ✅ Offline-first

---

## 🔒 Segurança

- [x] bcrypt (senhas)
- [x] JWT com refresh token
- [x] CORS configurado
- [x] Helmet.js
- [x] Input validation (Zod)
- [x] SQL injection protection
- [ ] MQTT TLS (futuro)
- [ ] Rate limiting (futuro)

---

## 📈 Performance

**Benchmarks:**
- Login: ~120ms
- GET /devices: ~10ms
- MQTT throughput: ~1000 msgs/s
- Bundle size: ~300KB (gzipped)

---

## 👥 Contribuindo

1. Fork o repositório
2. Branch: `git checkout -b feat/nova-feature`
3. Commit: `git commit -m 'feat: descrição'`
4. Push: `git push origin feat/nova-feature`
5. Abra Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE)

---

## 🙏 Agradecimentos

- **Rodrigo Lange** - Desenvolvedor gordão barbudo raiz!
- **Claude (Anthropic)** - Pair programming IA
- **ChatGPT (OpenAI)** - Revisões
- **Grok (xAI)** - Código técnico
- **DeepSeek** - Documentação
- **Google** - Inspirações

**Sem IA esse trabalho seria impensável!**  
**USE e ABUSE!**

**Leu até aqui?** Me pague um ☕️  
**PIX:** +5541988360405

---

## 📞 Contato

- **Repositório:** https://github.com/rodrigo-s-lange/easysmart-platform
- **Issues:** https://github.com/rodrigo-s-lange/easysmart-platform/issues
- **Telefone:** +5541988360405 (WhatsApp)
- **Email:** rodrigosilvalange@gmail.com
- **Local:** Curitiba/PR - Brasil

---

## 🎓 Aprendizados do Projeto

### **Técnicos**
1. **Node.js 22 LTS** - Upgrade valeu a pena (performance + suporte até 2027)
2. **Multi-tenancy** - Row-level security é simples mas CRÍTICO testar
3. **InfluxDB batching** - Buffer + batch write = 10x melhor performance
4. **React Query** - Elimina 80% do boilerplate
5. **TailwindCSS v3** - v4 ainda experimental

### **Arquiteturais**
1. **Sidebar > Top Nav** - Escalável para 10+ seções
2. **Página > Modal** - Device detail precisa espaço (20+ entities)
3. **React Query > Zustand** - Para data fetching, cache inteligente
4. **ESPHome agora** - Validação de mercado antes de firmware proprietário
5. **Admin Panel** - Essencial para modelo SaaS B2B

### **Processo**
1. **LLM collaboration** - Funciona MUITO bem com decisões claras
2. **Decisões upfront** - Arquitetura antes = menos refatoração
3. **Commits frequentes** - Facilita rollback
4. **Documentação viva** - README como fonte única de verdade
5. **Testes manuais** - Validar multi-tenancy a cada feature

---

## 🎯 Filosofia do Projeto

> **"Qualidade > Velocidade. Melhor fazer certo da primeira vez."**

**Princípios:**
1. **Segurança primeiro** - Multi-tenancy não é negociável
2. **Código limpo** - Sem TODOs, sem placeholders
3. **Documentação viva** - README sempre atualizado
4. **Testes antes de commit** - Validar antes de subir
5. **Decisões documentadas** - Justificar escolhas importantes
6. **Colaboração transparente** - Perguntar quando em dúvida

---

## 🚀 Próxima Sessão

**Para você ou próxima IA:**

1. ✅ Ler este README completo
2. ✅ Executar comandos de verificação
3. ✅ Validar multi-tenancy funcionando
4. 🚧 Iniciar Phase 2.1.5 (Role System)
5. 🚧 Criar artifacts conforme padrões
6. ✅ Testar extensivamente
7. ✅ Commitar com mensagem clara
8. ✅ Atualizar CHANGELOG.md

**Boa sorte! O projeto está sólido e pronto para evoluir.** 🎉

---

## 📝 Estrutura do Projeto

```
easysmart-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── logger.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── deviceController.js
│   │   │   ├── deviceApiController.js
│   │   │   ├── telemetryController.js
│   │   │   └── adminController.js (novo - Phase 2.1.5)
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── devices.js
│   │   │   ├── telemetry.js
│   │   │   └── admin.js (novo - Phase 2.1.5)
│   │   ├── services/
│   │   │   ├── influxService.js
│   │   │   └── mqttService.js
│   │   ├── utils/
│   │   │   └── token.js
│   │   └── server.js
│   ├── migrations/
│   │   ├── 1760638437331_create-initial-schema.js
│   │   └── 1760xxxxxx_add-role-to-users.js (novo)
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   └── card.tsx
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx (Phase 2.2)
│   │   │       ├── TopBar.tsx (Phase 2.2)
│   │   │       └── Layout.tsx (Phase 2.2)
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── utils.ts
│   │   │   └── queryClient.ts
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── admin/ (Phase 2.3)
│   │   │       ├── Tenants.tsx
│   │   │       ├── TenantDetail.tsx
│   │   │       ├── Devices.tsx
│   │   │       └── Metrics.tsx
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── AdminRoute.tsx (Phase 2.1.5)
│   │   ├── stores/
│   │   │   └── authStore.ts
│   │   ├── types/
│   │   │   └── auth.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── esphome-examples/
├── .gitignore
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## 🔄 Ciclo de Desenvolvimento

```
1. Ler README + contexto da última sessão
2. Validar ambiente (backend + frontend)
3. Discutir tarefa com desenvolvedor
4. Implementar feature completa
5. Testar (incluindo multi-tenancy)
6. Commit com mensagem clara
7. Atualizar documentação
8. Repetir
```

---

## 🎯 Métricas de Sucesso

**Uma sessão é bem-sucedida quando:**
- ✅ Código funciona sem erros
- ✅ Multi-tenancy validado
- ✅ Testes manuais passando
- ✅ Commits claros e incrementais
- ✅ Documentação atualizada
- ✅ Nenhuma regressão
- ✅ Desenvolvedor satisfeito

---

## 📚 Recursos de Referência Rápida

**Backend:**
```bash
# Schema
docker exec -it postgres psql -U postgres -d easysmart -c "\d devices"

# Health
curl http://localhost:3010/health | jq

# Logs
tail -f backend/logs/app.log
```

**Frontend:**
```bash
# Lint
npm run lint

# Build
npm run build

# Preview
npm run preview
```

**Git:**
```bash
# Status curto
git status --short

# Diff resumido
git diff --stat

# Log gráfico
git log --oneline --graph -10
```

---

## ⚠️ Avisos Críticos para LLMs

### **NUNCA:**
❌ Queries sem `tenant_id`  
❌ Usar colunas antigas (mqtt_id, model, manufacturer)  
❌ localStorage/sessionStorage em artifacts  
❌ Commits sem testar multi-tenancy  
❌ Assumir estrutura do banco  
❌ TODOs ou placeholders  
❌ Pular validações  

### **SEMPRE:**
✅ Filtrar por `tenant_id`  
✅ Usar colunas reais (verificar schema)  
✅ Testar multi-tenancy após mudanças  
✅ Criar código funcional completo  
✅ Perguntar quando em dúvida  
✅ Seguir padrões estabelecidos  
✅ Documentar decisões  

---

## 🌟 Template de Primeira Mensagem (LLMs)

```
Olá! Vou continuar o desenvolvimento do EasySmart IoT Platform.

Li o README completo e entendi que:
- Phase 2.1 completa (Autenticação OK)
- Phase 2.1.5 em andamento (Role System)
- Multi-tenancy é CRÍTICO
- Schema PostgreSQL: id, name, status, metadata
- Stack: Node 22 + Express 5 + React 18

Confirmo:
1. Backend rodando? (porta 3010)
2. Frontend rodando? (porta 5173)
3. Multi-tenancy validado?
4. Posso começar com Phase 2.1.5 Sprint 1?

Aguardo confirmação! 🚀
```

---

## 💾 Commits Ideais

```bash
# Exemplo de sessão
git commit -m "feat(backend): add role column to users table"
git commit -m "feat(backend): implement requireSuperAdmin middleware"
git commit -m "feat(backend): add admin routes (tenants, devices, metrics)"
git commit -m "test: validate role-based access control"
git commit -m "docs: update README with role system"
```

**Commits pequenos e frequentes > Commits grandes**

---

## 🎬 Conclusão

Este README é a **fonte única de verdade** do projeto.

**Sempre:**
1. Leia este documento primeiro
2. Verifique código existente
3. Teste localmente
4. Pergunte se tiver dúvidas

**O projeto está sólido e pronto para crescer!** 🚀

---
**Última atualização:** 2025-10-18  
**Versão:** 0.3.0  
**Status:** Phase 2.1.5 Complete ✅ | Next: Phase 2.2 (Device Management UI)

---

*Desenvolvido com ❤️ em Curitiba/PR - Brasil*  
*Powered by Human + AI Collaboration*

---

**FIM DO README.md**