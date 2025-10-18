# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.3.0] - 2025-10-18

### 🎉 Phase 2.1.5: Role System & Admin Base - COMPLETO

#### ✨ Added (Novidades)

**Sprint 1: Backend - Roles**
- Sistema de controle de acesso baseado em roles (RBAC)
- 3 níveis de acesso: `super_admin`, `tenant_admin`, `user`
- Migration `1760738000000_add-role-to-users.js`
  - Adiciona coluna `role` na tabela `users`
  - Constraint para validar roles válidos
  - Índice para queries rápidas por role
  - Atualiza usuário admin existente para `super_admin`
- Middleware `requireSuperAdmin.js`
  - Protege rotas administrativas
  - Logs estruturados de tentativas de acesso
  - Mensagens de erro descritivas
- Endpoint `GET /api/v1/auth/users/me`
  - Retorna informações do usuário autenticado
  - Inclui role no response

**Sprint 2: Admin Routes**
- Controller `adminController.js` com 5 endpoints administrativos
- Routes `routes/admin.js` protegidas por `requireSuperAdmin`
- `GET /api/v1/admin/tenants`
  - Lista todos tenants da plataforma
  - Métricas por tenant (user_count, device_count)
  - Status ativo/inativo automático
- `GET /api/v1/admin/tenants/:id`
  - Detalhes completos do tenant
  - Lista de usuários do tenant
  - Lista de devices do tenant
  - Métricas agregadas
- `POST /api/v1/admin/tenants/:id/impersonate`
  - Recurso de suporte técnico
  - Gera tokens para logar como tenant
  - Motivo obrigatório (auditoria)
  - Logs detalhados para compliance
- `GET /api/v1/admin/devices`
  - Lista cross-tenant de devices
  - Filtros: tenant_id, status
  - Paginação (limit, offset)
  - Contagem de entities por device
- `GET /api/v1/admin/metrics`
  - Métricas agregadas da plataforma
  - Estatísticas de tenants, users, devices
  - Métricas de entities por tipo
  - Atividade de login (últimas 24h)
- Script de testes automatizados `test-admin-routes.sh`
  - Testa todos os 6 endpoints admin
  - Validação de bloqueio de acesso
  - Teste de impersonate completo
  - Colorização de output

#### 🔧 Changed (Mudanças)

- `authController.js`
  - Todas queries agora usam `token_hash` (corrigido de `token`)
  - JWT payload inclui campo `role`
  - Função `register` cria primeiro usuário como `tenant_admin`
  - Funções `login`, `refresh` retornam `role` no response
  - Função `logout` atualizada para usar `token_hash`
- `server.js`
  - Registra rotas admin: `app.use('/api/v1/admin', adminRoutes)`
- Todos endpoints de autenticação agora retornam role do usuário

#### 🔒 Security (Segurança)

- Implementação de RBAC (Role-Based Access Control)
- Middleware de autorização para rotas administrativas
- Validação de role no JWT
- Auditoria de impersonate com logs estruturados
- Isolamento multi-tenancy validado em todas rotas admin

#### ✅ Tests (Testes)

- 100% dos endpoints admin testados e funcionando
- 6/6 testes passing no script automatizado
- Validação de bloqueio de acesso não-admin
- Teste completo de impersonate
- Multi-tenancy isolation validado

#### 📚 Documentation (Documentação)

- Documentação completa das rotas admin no README
- Exemplos de uso de cada endpoint
- Guia de testes automatizados
- Atualização do roadmap

---

## [0.2.1] - 2025-10-17

### Phase 2.1: Frontend Authentication

#### ✨ Added

- Interface de login e registro com React 18 + TypeScript
- Validação de formulários com Zod
- Gerenciamento de estado com Zustand
- Data fetching com React Query
- Design system com TailwindCSS v3 + shadcn/ui
- Rotas protegidas (ProtectedRoute component)
- Auto-refresh de tokens JWT
- Dark theme profissional com gradientes
- Dashboard básico com placeholder

#### 🔧 Changed

- Migração completa para TypeScript no frontend
- Substituição de Context API por Zustand
- Implementação de React Query para cache
- Atualização para Vite 8

#### ✅ Tests

- Login/logout funcionando
- Registro de novos usuários
- Auto-refresh de tokens validado
- Multi-tenancy funcionando no frontend

---

## [0.2.0] - 2025-10-16

### Phase 1: Backend Core

#### ✨ Added

**Backend Core**
- Express 5.1.0 com middlewares de segurança (Helmet, CORS)
- PostgreSQL 16 com migrações (node-pg-migrate)
- InfluxDB 2.x para telemetria time-series
- MQTT Broker (Mosquitto) com auto-discovery
- JWT Authentication (access 15min + refresh 7d)
- Logging estruturado com Pino
- Health check endpoint

**Multi-tenancy**
- Row-level security no PostgreSQL
- Isolamento total de dados por tenant
- Validação de tenant_id em todas queries

**Device Management**
- CRUD completo de devices
- Auto-provisioning via MQTT discovery
- Device tokens seguros
- Status tracking (online/offline/unclaimed)
- Metadata JSONB flexível

**Entity System**
- Suporte a sensors, switches, binary_sensors
- Device class para categorização
- Unit of measurement
- Attributes JSONB para dados custom
- Cascade delete com devices

**Telemetry API**
- Buffer interno para otimização
- Batch writes para InfluxDB
- Queries com agregação (mean, max, min)
- Time windows configuráveis
- Latest value endpoint

**MQTT Integration**
- Auto-discovery ESPHome-compatible
- Topics estruturados: easysmart/{device_id}/{type}/{entity_id}/state
- Suporte a JSON e texto simples
- Reconnect automático

#### 🔒 Security

- bcrypt para hash de senhas
- JWT com refresh tokens
- CORS configurado
- Helmet.js habilitado
- SQL injection protection (parameterized queries)

#### 📊 Database Schema

- Tabela `tenants`
- Tabela `users` com foreign key para tenants
- Tabela `devices` com multi-tenancy
- Tabela `entities` com cascade delete
- Tabela `refresh_tokens` com expiração
- Índices otimizados

---

## [0.1.0] - 2025-10-15

### Initial Setup

#### ✨ Added

- Estrutura inicial do projeto
- Configuração Git
- README.md básico
- .gitignore
- LICENSE (MIT)

---

## Notas de Versão

### Compatibilidade

- **Node.js:** 22.20.0 LTS (suporte até 2027)
- **PostgreSQL:** 16.10+
- **InfluxDB:** 2.x
- **React:** 18.x
- **TypeScript:** 5.x

### Breaking Changes

#### [0.3.0]
- Nenhuma breaking change. Todas mudanças são aditivas.
- Migration adiciona coluna `role` com valor padrão, não quebra código existente.

#### [0.2.1]
- Frontend requer Node.js 22+
- Mudança de Context API para Zustand (não afeta usuários, apenas desenvolvedores)

#### [0.2.0]
- Primeira versão funcional
- Requer PostgreSQL 16+ para suporte a JSONB e gen_random_uuid()

---

## Próximos Passos

### [0.4.0] - Em Planejamento

**Phase 2.2: Device Management UI**
- Sidebar navigation completa
- Dashboard adaptativo
- Device list responsiva
- Entity modals com charts
- Export CSV de telemetria

**Phase 2.3: Admin Panel UI**
- Interface de gestão de tenants
- View global de devices
- Dashboards de métricas
- UI de impersonate

---

## Contribuindo

Para adicionar entradas neste CHANGELOG:

1. Use as categorias: Added, Changed, Deprecated, Removed, Fixed, Security
2. Seja descritivo mas conciso
3. Inclua referências a issues/PRs quando relevante
4. Mantenha ordem cronológica decrescente
5. Adicione links de comparação no final do arquivo

---

## Links

- [Repositório](https://github.com/rodrigo-s-lange/easysmart-platform)
- [Issues](https://github.com/rodrigo-s-lange/easysmart-platform/issues)
- [Documentação](https://github.com/rodrigo-s-lange/easysmart-platform/blob/main/README.md)

---

**Formato baseado em [Keep a Changelog](https://keepachangelog.com/)**  
**Versionamento [Semantic Versioning](https://semver.org/)**