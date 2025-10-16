# 🧾 CHANGELOG — EasySmart IoT Platform

> Histórico técnico do projeto, conforme convenções **Conventional Commits**.  
> Cada fase corresponde a um marco da arquitetura SaaS e IoT da plataforma.

---

## [1.2.0] - 2025-10-16  
### 🎯 Phase 1.2 — Backend Base & Auth (API)

#### ✨ Novas Funcionalidades
- **Autenticação completa JWT** com refresh tokens persistentes  
- **Registro de usuários e tenants automáticos** (`/api/v1/auth/register`)  
- **Endpoints REST**: `register`, `login`, `refresh`, `logout`, `me`  
- **Criação de tenants isolados** (multi-tenant real via PostgreSQL)  
- **Hash seguro de senhas** com bcrypt (10 rounds)  
- **Validação de entrada** com Zod  
- **Health check avançado** com timeout e status detalhado de serviços  
- **Conexão segura e não bloqueante** com PostgreSQL, InfluxDB e MQTT  
- **Logs estruturados** com Pino + middleware HTTP  
- **Infraestrutura de migrations** via `node-pg-migrate`

#### 🧱 Estrutura de Banco de Dados
Criação das tabelas base:
- `tenants`, `users`, `device_templates`, `devices`, `entities`, `refresh_tokens`

#### 🔒 Segurança
- Tokens JWT curtos + refresh opacos persistentes  
- Middleware `requireAuth` e `requireRole`  
- Sanitização e validação de payloads  
- Helmet + CORS habilitados por padrão  
- Timeout e retry controlados para conexões externas  

#### 🐛 Correções / Melhorias
- Timeout no health check evitando travamento do servidor  
- Inicialização assíncrona do MQTT client (com retry e logs)  
- Corrigido bloqueio da porta 3001 → mudança para 3010  
- Ajuste do `.env` e padronização do arquivo de configuração  

#### 🧩 Stack Atualizada
Node.js 18 / Express 5 / Pino / Zod
PostgreSQL 16 + InfluxDB 2.x
Mosquitto MQTT 5 Broker
Docker Compose / Portainer / Watchtower

yaml
Copiar código

---

## [1.1.0] - 2025-10-10  
### 🧰 Phase 1.1 — Infraestrutura & Conectividade

#### ✨ Entregas
- Configuração completa de infraestrutura Docker:  
  PostgreSQL · InfluxDB · Mosquitto · ESPHome · Home Assistant · Portainer · Watchtower  
- Criação do projeto `backend/` e estrutura base Node.js  
- Conexões básicas com bancos e MQTT (versão inicial)  
- Scripts `npm start` / `npm dev`  
- Ambiente `.env.example` e documentação inicial  
- Configuração de GitHub e README.md com arquitetura inicial  

---

## [1.0.0] - 2025-10-03  
### 🚀 Bootstrap do Projeto

- Estrutura inicial de diretórios (`backend`, `frontend`, `docs`)  
- Configuração Git + SSH + MIT License  
- Base de documentação e convenções de commit  
- Infraestrutura Docker inicializada  

---

**Próxima Etapa:**  
📦 Phase 1.3 — Device Management & MQTT Auto-Discovery  
> CRUD de devices · claim tokens · auto-discovery ESPHome · atualização de status e telemetria

---

© 2025 Rodrigo S. Lange · MIT License
