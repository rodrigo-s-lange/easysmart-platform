# 🏭 EasySmart IoT Platform

Plataforma **SaaS multi-tenant** para gerenciamento de dispositivos IoT industriais e residenciais — com arquitetura híbrida, integração MQTT nativa e pronto para expansão com Machine Learning.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E=18.19.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![InfluxDB](https://img.shields.io/badge/InfluxDB-2.x-blue)](https://www.influxdata.com/)

---

## ✨ Visão Geral

**EasySmart** é uma plataforma completa para IoT corporativo e residencial que combina:

- 🔐 Multi-tenant com isolamento total  
- 🧱 Backend Node.js com PostgreSQL + InfluxDB  
- 📡 Comunicação em tempo real via MQTT  
- 📊 Armazenamento híbrido (relacional + time-series)  
- ⚙️ Auto-discovery nativo para dispositivos ESPHome  
- 💻 Painel Web (em desenvolvimento)  
- 🚀 Modelo SaaS com planos escaláveis  

---

## 🏗️ Arquitetura

ESP32 / ESPHome
⇩ MQTT Topics
Mosquitto Broker (1883)
⇩
├─ PostgreSQL → metadados (usuários, tenants, devices, entidades)
├─ InfluxDB → séries temporais (telemetria)
└─ Backend Node.js (3010)
⇩ REST API /auth /devices
⇩
Frontend React (3000)

markdown
Copiar código

### Health & Services  
| Serviço | Porta | Status |
|----------|-------|---------|
| PostgreSQL | 5432 | ✅ Conectado |
| InfluxDB | 8086 | ✅ Conectado |
| Mosquitto MQTT | 1883 | ✅ Conectado |
| Backend API | 3010 | ✅ Operacional |

---

## 🧩 Fases do Projeto

### ✅ Phase 1.2 — Backend Base & Auth (Concluída)
**Principais entregas:**
- Conexões seguras a PostgreSQL / InfluxDB / MQTT com timeout  
- API REST `/api/v1/auth`:
  - `register`, `login`, `refresh`, `logout`, `me`
- JWT + Refresh Tokens persistentes  
- Multi-tenant automático (tenant criado no registro)  
- Hash de senhas com bcrypt  
- Health-check integrado (`/health`)  
- Estrutura de logs Pino + middleware seguro  

**Testado e validado**  
```bash
curl http://localhost:3010/health
# {"status":"ok","services":{"postgres":true,"influxdb":true,"mqtt":true}}
🚧 Próxima Etapa — Phase 1.3 Device Management & MQTT Auto-Discovery
Objetivo: integração total entre dispositivos ESPHome e backend.

Módulo	Descrição
CRUD de Devices	/api/v1/devices, provisionamento e claim via QR code
MQTT Service	Assinatura de easysmart/{device}/discovery
Auto-Discovery	Criação automática de entidades
Persistência	Atualização de status, last_seen, metadata
Segurança	Device Token ≠ User Token
Templates	Registro de templates ESPHome reutilizáveis

🧱 Stack Tecnológica
Camada	Tecnologias
Backend	Node.js 18 / Express 5 / Pino / Zod
Banco Relacional	PostgreSQL 16 (pg)
Time-Series	InfluxDB 2.x (@influxdata/influxdb-client)
Mensageria	Mosquitto MQTT 5 (mqtt)
Infra	Docker Compose / Portainer / Watchtower
Segurança	JWT + Refresh, bcrypt, helmet, CORS
DevTools	node-pg-migrate / jest / eslint / prettier

📡 MQTT Topics Padrão
swift
Copiar código
easysmart/{DEVICE_ID}/sensor/{ENTITY}/state      # {"value":23.5,"unit":"°C"}
easysmart/{DEVICE_ID}/switch/{ENTITY}/state      # {"state":"ON"}
easysmart/{DEVICE_ID}/switch/{ENTITY}/command    # "ON" | "OFF"
easysmart/{DEVICE_ID}/availability               # "online" | "offline"
easysmart/{DEVICE_ID}/discovery                  # Auto-discovery JSON
🧪 Testes Locais
bash
Copiar código
# Iniciar backend
cd backend
npm run dev

# Registrar usuário admin
curl -X POST http://localhost:3010/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local.com","password":"123456"}'

# Health check
curl http://localhost:3010/health
⚙️ Infraestrutura Docker
Serviços disponíveis em ~/docker:

Serviço	Porta	Descrição
PostgreSQL	5432	Banco relacional
InfluxDB	8086	Time-series
Mosquitto	1883	Broker MQTT
ESPHome	6052	Firmware Manager
Home Assistant	8123	Integração opcional
Portainer	9000	Gerenciamento Docker
Watchtower	—	Atualizações automáticas

🧰 Comandos Úteis
bash
Copiar código
# Verificar status dos serviços
cd ~/docker && docker compose ps

# Logs de containers
docker logs postgres --tail 20
docker logs influxdb --tail 20
docker logs mosquitto --tail 20

# Testar MQTT
docker exec mosquitto mosquitto_pub \
  -h localhost -u devices \
  -P '6XTPzoU1rt44dN6cVdqOAh2r5KNRi3yO3YO2aZZO8' \
  -t 'test' -m 'hello'
📋 Roadmap
Fase	Status	Descrição
1.1	✅	Infraestrutura + DBs via Docker
1.2	✅	Backend Base + Auth API
1.3	🚧	Device Management & Auto-Discovery
2.0	⏳	Frontend Dashboard (React + Vite)
2.1	⏳	Admin Panel + Billing SaaS
3.0	🔜	ML Analytics & Edge Processing

🧠 Segurança
Password hash com bcrypt (10 rounds)

JWT com expiração curta + refresh persistente

CORS configurado

Helmet HTTP headers

SQL injection protegido (prepared statements)

Row-Level Security por tenant (PostgreSQL)

🧑‍💻 Autor
Rodrigo S. Lange — Founder & Lead Developer
📧 rodrigo@easysmart.io
🐙 GitHub
🌐 easysmart.com.br

📝 Licença
Este projeto é licenciado sob a MIT License.

Versão: 1.2.0
Atualizado em: 16 Outubro 2025
Status: ✅ Phase 1.2 completa — pronto para Phase 1.3 (MQTT Auto-Discovery)