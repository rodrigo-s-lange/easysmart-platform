# 🏭 EasySmart IoT Platform

Plataforma SaaS multi-tenant para gerenciamento de dispositivos IoT industriais e residenciais.

---

## 🔧 Status Atual

| Fase | Descrição | Status |
|------|------------|---------|
| **1.1** | Infraestrutura Docker (PostgreSQL, InfluxDB, Mosquitto) | ✅ |
| **1.2** | Backend Base + Auth API (JWT) | ✅ |
| **1.3** | MQTT Auto-Discovery → Persistência em PostgreSQL | ✅ |
| **1.4** | Device API REST (Listagem e gerenciamento) | 🚧 Em progresso |

---

## 🧩 Componentes principais

**Backend:** Node 18 · Express 5 · PostgreSQL 16 · InfluxDB 2.x · Mosquitto MQTT  
**Infra:** Docker Compose · Portainer · Watchtower  
**Auth:** bcrypt · JWT · Refresh Tokens  
**Logs:** Pino  
**Schema Migrations:** node-pg-migrate

---

## 📡 Fluxo IoT

ESPHome (ESP32)
⇩ MQTT Publish
Mosquitto Broker
⇩
Backend Node.js (3010)
⇩
PostgreSQL – metadados · InfluxDB – telemetria
⇩
Frontend React – Dashboard

yaml
Copiar código

---

## ⚙️ Comunicação Ativa

### REST API
`/api/v1/auth/*`   – Usuários  
`/api/v1/devices/*` – Dispositivos (Phase 1.4)

### MQTT Topics
easysmart/{device}/discovery
easysmart/{device}/sensor/{entity}/state
easysmart/{device}/switch/{entity}/state
easysmart/{device}/availability

yaml
Copiar código

---

## 🧾 Serviços Docker

| Serviço | Porta | Função |
|----------|--------|---------|
| postgres | 5432 | Banco relacional |
| influxdb | 8086 | Time-series |
| mosquitto | 1883 | Broker MQTT |
| esphome | 6052 | Firmware manager |
| backend (Node) | 3010 | API REST + MQTT listener |
| portainer | 9000 | Gerenciamento Docker |

---

## 📦 Últimas implementações (Phase 1.3)

- Serviço MQTT com assinatura automática dos tópicos  
- Controller `deviceController.js` (persistência automática)  
- Geração automática de `device_token` para auth MQTT  
- Atualização automática de status e `last_seen`  
- Log estruturado Pino para cada mensagem recebida  
- Validação de payload e idempotência por mqtt_id  

---

## 🧭 Diretivas para IA (continuidade de desenvolvimento)

1. **Um arquivo por vez**, sempre com `cat > ... << 'EOF'`  
2. **Confirmar logs e testes** antes de avançar  
3. **Manter commits semânticos** (`feat:`, `fix:`, `docs:`)  
4. **Não pular validações manuais** – testar cada etapa  
5. **Prioridade da próxima fase:** `/api/v1/devices` CRUD + integração InfluxDB

---

**Autor:** Rodrigo S. Lange  
**Versão:** 1.3.0  
**Atualizado em:** 16 Out 2025