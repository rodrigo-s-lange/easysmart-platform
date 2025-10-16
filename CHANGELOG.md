# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2025-10-16

### Adicionado

#### Backend Base (Phase 1.1)
- Setup inicial do projeto Node.js com Express 5.1.0
- Configuração de logging estruturado com Pino
  - Pretty logging em desenvolvimento
  - JSON logging em produção
- Implementação de conexões com infraestrutura:
  - PostgreSQL 16 (pool de conexões)
  - InfluxDB 2.x (write/query API)
  - MQTT (pub/sub com reconexão automática)
- Middleware global de error handling
  - Tratamento de erros assíncronos (asyncHandler)
  - Handler de rotas 404
  - Error handler com logs estruturados
- Health check endpoint (`GET /health`)
  - Verifica status de todos os serviços
  - Retorna uptime e informações do sistema
- Graceful shutdown
  - Fecha conexões na ordem correta
  - Timeout de 30s para shutdown forçado
- Middlewares de segurança:
  - Helmet (HTTP headers)
  - CORS configurável
  - Body parser com limite de 10MB

#### Infraestrutura
- Docker Compose com todos os serviços:
  - PostgreSQL 16
  - InfluxDB 2.7
  - Mosquitto MQTT
  - ESPHome
  - Home Assistant
  - Portainer
  - Watchtower (auto-update)
- Scripts de inicialização e healthcheck

#### Documentação
- README.md completo com:
  - Arquitetura detalhada
  - Guia de instalação
  - Estrutura do projeto
  - API endpoints
  - MQTT topics
  - Troubleshooting
  - Contexto para desenvolvimento com IA
- LICENSE (MIT)
- .gitignore configurado

### Segurança
- Senhas fortes geradas para todos os serviços
- Credenciais isoladas em arquivos .env
- Headers HTTP seguros (Helmet)
- Validação de CORS

### Performance
- Pool de conexões PostgreSQL (max: 20)
- Logging assíncrono com Pino
- Reconexão automática MQTT

---

## [Unreleased]

### A Fazer (Phase 1.2 - Database & Auth)
- [ ] Schema PostgreSQL com migrations
- [ ] Tabelas: tenants, users, devices, entities
- [ ] Autenticação JWT
- [ ] Middleware de autorização
- [ ] CRUD de usuários
- [ ] Sistema multi-tenant

### A Fazer (Phase 1.3 - Device Management)
- [ ] CRUD de dispositivos
- [ ] Auto-discovery via MQTT
- [ ] Device provisioning
- [ ] Entity management
- [ ] Tracking de status dos dispositivos

### A Fazer (Phase 1.4 - Telemetry)
- [ ] Ingestão de telemetria via MQTT
- [ ] Queries time-series (InfluxDB Flux)
- [ ] Agregações e estatísticas
- [ ] Sistema de alertas

### A Fazer (Phase 2.x - Frontend)
- [ ] Setup React + Vite + TypeScript
- [ ] Dashboard principal
- [ ] Autenticação (login/register)
- [ ] Gerenciamento de dispositivos
- [ ] Gráficos em tempo real

---

## Tipos de Mudanças

- **Adicionado** - para novas funcionalidades
- **Modificado** - para mudanças em funcionalidades existentes
- **Descontinuado** - para funcionalidades que serão removidas
- **Removido** - para funcionalidades removidas
- **Corrigido** - para correção de bugs
- **Segurança** - em caso de vulnerabilidades

---

[0.1.0]: https://github.com/rodrigo-s-lange/easysmart-platform/releases/tag/v0.1.0
