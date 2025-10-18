# ✅ Checklist de Validação - Phase 2.1.5: Role System

## 📋 Sprint 1: Backend - Roles

### 1️⃣ Migration
- [ ] Arquivo `1760738000000_add-role-to-users.js` copiado para `backend/migrations/`
- [ ] Migration executada com sucesso (`npm run migrate up`)
- [ ] Coluna `role` criada na tabela `users`
- [ ] Constraint `users_role_check` criado
- [ ] Índice em `role` criado
- [ ] Usuário `admin@easysmart.io` atualizado para `super_admin`
- [ ] Outros usuários atualizados para `tenant_admin`

**Validação:**
```bash
docker exec -it postgres psql -U postgres -d easysmart -c "
SELECT email, role FROM users;
"
```

**Resultado esperado:**
```
email                    | role
-------------------------+--------------
admin@easysmart.io       | super_admin
outros@example.com       | tenant_admin
```

---

### 2️⃣ AuthController
- [x] ✅ `register`: Primeiro usuário do tenant criado como `tenant_admin`
- [x] ✅ `login`: Busca e retorna `role` do usuário
- [x] ✅ `refresh`: Inclui `role` no novo JWT
- [x] ✅ JWT payload inclui campo `role`

**Validação:**
```bash
# Login
curl -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq '.user.role'

# Deve retornar: "super_admin"
```

---

### 3️⃣ Middleware requireSuperAdmin
- [x] ✅ Arquivo `backend/src/middleware/requireSuperAdmin.js` criado
- [ ] Middleware testado (próximo passo)

**Validação:**
```bash
# Testar acesso sem autenticação
curl -X GET http://localhost:3010/api/v1/admin/test

# Deve retornar 401: Authentication required
```

---

### 4️⃣ Seed Super Admin
- [x] ✅ Usuário `admin@easysmart.io` existe e é `super_admin`

**Validação:**
```bash
docker exec -it postgres psql -U postgres -d easysmart -c "
SELECT id, email, role, tenant_id 
FROM users 
WHERE email = 'admin@easysmart.io';
"
```

---

## 📋 Sprint 2: Admin Routes (PRÓXIMO)

### Arquivos a criar:
- [ ] `backend/src/controllers/adminController.js`
- [ ] `backend/src/routes/admin.js`

### Rotas a implementar:
- [ ] `GET /api/v1/admin/tenants` - Listar todos tenants
- [ ] `GET /api/v1/admin/tenants/:id` - Detalhes do tenant
- [ ] `POST /api/v1/admin/tenants/:id/impersonate` - Gerar token como tenant
- [ ] `GET /api/v1/admin/devices` - Listar todos devices (cross-tenant)
- [ ] `GET /api/v1/admin/metrics` - Métricas da plataforma

---

## 🧪 Testes Críticos

### Teste 1: Isolamento Multi-tenancy
```bash
# Login como tenant_admin
TENANT_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant@example.com","password":"senha123"}' \
  | jq -r '.tokens.accessToken')

# Tentar acessar rota admin (DEVE FALHAR)
curl -X GET http://localhost:3010/api/v1/admin/tenants \
  -H "Authorization: Bearer $TENANT_TOKEN"

# Deve retornar 403: Access denied
```

### Teste 2: Super Admin tem acesso
```bash
# Login como super_admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq -r '.tokens.accessToken')

# Acessar rota admin (DEVE FUNCIONAR)
curl -X GET http://localhost:3010/api/v1/admin/tenants \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Deve retornar 200 com lista de tenants
```

### Teste 3: Refresh token mantém role
```bash
# Renovar token
curl -X POST http://localhost:3010/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
  | jq '.tokens.accessToken' | jwt decode -

# JWT deve conter: "role": "super_admin"
```

---

## 🔍 Troubleshooting

### Migration falha
```bash
# Ver última migration aplicada
docker exec -it postgres psql -U postgres -d easysmart -c "
SELECT * FROM pgmigrations ORDER BY run_on DESC LIMIT 1;
"

# Reverter migration (se necessário)
cd ~/easysmart-platform/backend
npm run migrate down
```

### Role não aparece no JWT
```bash
# Verificar payload do JWT
echo "$ACCESS_TOKEN" | cut -d'.' -f2 | base64 -d | jq '.'

# Deve conter:
# {
#   "userId": "...",
#   "tenantId": "...",
#   "role": "super_admin",  ← DEVE EXISTIR
#   "iat": ...,
#   "exp": ...
# }
```

### Backend não reconhece role
```bash
# Verificar logs do backend
tail -f ~/easysmart-platform/backend/logs/app.log

# Procurar por: "Login realizado" com campo "role"
```

---

## 📊 Métricas de Sucesso

- ✅ Migration executada sem erros
- ✅ Coluna `role` existe e tem constraint
- ✅ Super admin consegue login
- ✅ JWT contém campo `role`
- ✅ Middleware bloqueia acesso de non-admin
- ✅ Logs registram tentativas de acesso

---

## 🚀 Status Atual

**Phase 2.1.5 - Sprint 1: Backend - Roles**
- ⏳ **EM VALIDAÇÃO**

**Próximo Sprint:**
- Sprint 2: Admin Routes (4-6h)

---

## 📝 Notas

- Sempre testar multi-tenancy após mudanças
- Logs devem registrar userId, tenantId e role
- Super admin NÃO deve ter tenant_id (ou ter tenant especial)
- Refresh token DEVE manter role no novo JWT

---

**Data:** 2025-10-17  
**Responsável:** Rodrigo Lange + Claude  
**Status:** Sprint 1 - Validação Pendente
