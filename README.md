# 🏭 EasySmart IoT Platform

Plataforma **SaaS multi-tenant** para gerenciamento de dispositivos **IoT industriais e residenciais**, com arquitetura híbrida, integração MQTT nativa e suporte futuro a Machine Learning.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=18.19.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![InfluxDB](https://img.shields.io/badge/InfluxDB-2.x-blue)](https://www.influxdata.com/)

---

## ✨ Visão Geral

O **EasySmart** oferece uma plataforma escalável e segura para monitoramento e controle de dispositivos IoT.  
Usa **PostgreSQL** para dados relacionais, **InfluxDB** para séries temporais e **Mosquitto MQTT** para comunicação em tempo real.

---

## 🧩 Fases do Projeto

| Fase | Descrição | Status |
|------|------------|---------|
| **1.1** | Infraestrutura Docker (PostgreSQL, InfluxDB, Mosquitto) | ✅ |
| **1.2** | Backend Base + Auth API (JWT) | ✅ |
| **1.3** | MQTT Auto-Discovery → Persistência em PostgreSQL | ✅ |
| **1.4** | API REST `/api/v1/devices` (listar, detalhar, deletar) | ✅ |
| **1.5** | Integração InfluxDB + telemetria MQTT → histórico | 🚧 |
| **2.0** | Frontend React (dashboard + gráficos) | ⏳ |
| **3.0** | ML Analytics & Edge Processing | 🔜 |

---

## 🏗️ Arquitetura

ESP32 / ESPHome
⇩ MQTT Topics
Mosquitto Broker (1883)
⇩
├── PostgreSQL → metadados (usuários, devices, entities)
├── InfluxDB → séries temporais (telemetria)
└── Backend Node.js (3010)
⇩ REST API /auth /devices
⇩
Frontend React (3000)

yaml
Copiar código

---

## ⚙️ Stack Técnica

| Camada | Tecnologias |
|--------|--------------|
| Backend | Node.js 18 · Express 5 · Pino · Zod |
| Banco Relacional | PostgreSQL 16 (`pg`) |
| Time-Series | InfluxDB 2.x (`@influxdata/influxdb-client`) |
| Mensageria | Mosquitto MQTT 5 (`mqtt`) |
| Infra | Docker Compose · Portainer · Watchtower |
| Segurança | JWT + Refresh, bcrypt, helmet, CORS |
| DevTools | node-pg-migrate · jest · eslint · prettier |

---

## 📦 Serviços Docker

| Serviço | Porta | Descrição |
|----------|--------|-----------|
| postgres | 5432 | Banco relacional |
| influxdb | 8086 | Time-series database |
| mosquitto | 1883 | Broker MQTT |
| esphome | 6052 | Gerador de firmware ESPHome |
| backend | 3010 | API REST + MQTT listener |
| portainer | 9000 | Gerenciamento Docker |
| watchtower | — | Atualizações automáticas |

---

## 📡 Comunicação IoT

### MQTT Topics

easysmart/{device}/discovery
easysmart/{device}/sensor/{entity}/state
easysmart/{device}/switch/{entity}/state
easysmart/{device}/switch/{entity}/command
easysmart/{device}/availability

bash
Copiar código

**Discovery** → Cria/atualiza device e entities  
**State** → Telemetria (→ InfluxDB na Phase 1.5)  
**Availability** → Online/offline  

---

## 🔐 Autenticação

- Passwords com `bcrypt` (10 rounds)  
- JWT de 15 min + refresh de 7 dias  
- Multi-tenant row-level security  
- Helmet + CORS + sanitização de entrada  

---

## 📡 API Reference – Phase 1.4

### 🔐 Auth
| Método | Endpoint | Descrição |
|---------|-----------|-----------|
| POST | `/api/v1/auth/register` | Registrar usuário e tenant |
| POST | `/api/v1/auth/login` | Login JWT |
| POST | `/api/v1/auth/refresh` | Renovar token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/users/me` | Usuário logado |

### 🧠 Devices
| Método | Endpoint | Descrição |
|---------|-----------|-----------|
| GET | `/api/v1/devices` | Lista todos os devices |
| GET | `/api/v1/devices/:id` | Detalhes de um device |
| GET | `/api/v1/devices/:id/entities` | Entities vinculadas |
| DELETE | `/api/v1/devices/:id` | Remove device e entities |

### 🧩 MQTT Topics
easysmart/{device}/discovery
easysmart/{device}/sensor/{entity}/state
easysmart/{device}/switch/{entity}/state
easysmart/{device}/switch/{entity}/command
easysmart/{device}/availability

yaml
Copiar código

---

## 🔍 Health Check

`GET /health`  
Retorna status dos serviços:
```json
{
  "status": "ok",
  "services": {
    "postgres": true,
    "influxdb": true,
    "mqtt": true
  }
}
🧰 Comandos Úteis
bash
Copiar código
# Verificar status dos containers
cd ~/docker && docker compose ps

# Logs dos serviços
docker logs postgres --tail 20
docker logs influxdb --tail 20
docker logs mosquitto --tail 20

# Testar MQTT
docker exec mosquitto mosquitto_pub \
  -h localhost -u devices \
  -P '6XTPzoU1rt44dN6cVdqOAh2r5KNRi3yO3YO2aZZO8' \
  -t 'easysmart/test' -m 'hello'
📈 Próximas Etapas
Fase	Objetivo	Principais Arquivos
1.5	Gravar leituras MQTT em InfluxDB (telemetria)	influxService.js, update mqttService.js
1.6	API de dados históricos (time-series)	/api/v1/data
2.0	Frontend React + gráficos reais	/frontend (app React + Vite)

🧭 Diretivas para IA (continuidade)
Um arquivo por vez, usando cat > ... << 'EOF'

Validar logs e testes antes de prosseguir

Commits semânticos (feat:, fix:, docs: …)

Documentar tudo após cada fase

Evitar dependências desnecessárias

Seguir roadmap na ordem das fases

🧑‍💻 Autor
Rodrigo S. Lange – Founder & Lead Developer
📧 rodrigo@easysmart.io
🐙 GitHub
🌐 easysmart.com.br

Versão: 1.4.0
Atualizado em: 16 Outubro 2025
Status: ✅ Phase 1.4 completa — pronto para Phase 1.5 (InfluxDB Telemetria)