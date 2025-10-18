# 🚀 Guia Rápido - Phase 2.1.5: Role System

## 📥 1. Baixar e Instalar Migration

```bash
# Baixar migration do Claude
# (Você já deve ter feito o download via interface)

# Copiar para diretório correto
cp ~/Downloads/1760738000000_add-role-to-users.js ~/easysmart-platform/backend/migrations/

# Verificar se foi copiado
ls -la ~/easysmart-platform/backend/migrations/
```

---

## ⚡ 2. Executar Migration

```bash
cd ~/easysmart-platform/backend

# Rodar migration
npm run migrate up

# Verificar se passou
# Deve mostrar: "1760738000000_add-role-to-users.js"
```

---

## ✅ 3. Validar no Banco

```bash
# Ver estrutura da coluna role
docker exec -it postgres psql -U postgres -d easysmart -c "
\d users
"

# Listar usuários e roles
docker exec -it postgres psql -U postgres -d easysmart -c "
SELECT email, role, tenant_id FROM users;
"
```

**Resultado esperado:**
```
email                  | role          | tenant_id
-----------------------+---------------+--------------------------------------
admin@easysmart.io     | super_admin   | <uuid do tenant EasySmart>
outro@example.com      | tenant_admin  | <uuid do tenant cliente>
```

---

## 🔐 4. Testar Login com Role

```bash
# Login como super_admin
curl -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq '.'
```

**Deve retornar:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@easysmart.io",
    "tenant_id": "uuid",
    "role": "super_admin"  ← IMPORTANTE!
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "rt_..."
  }
}
```

---

## 🎫 5. Extrair e Decodificar JWT

```bash
# Extrair access token
ACCESS_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq -r '.tokens.accessToken')

# Ver token
echo $ACCESS_TOKEN

# Decodificar payload (precisa instalar jwt-cli ou usar site jwt.io)
echo $ACCESS_TOKEN | cut -d'.' -f2 | base64 -d | jq '.'
```

**Payload deve conter:**
```json
{
  "userId": "uuid",
  "tenantId": "uuid",
  "role": "super_admin",  ← CRÍTICO!
  "iat": 1697543210,
  "exp": 1697544110
}
```

---

## 🧪 6. Testar Middleware requireSuperAdmin

Vamos criar uma rota de teste temporária:

```bash
# Editar backend/src/routes/devices.js
# Adicionar no final do arquivo (antes do module.exports):

const requireSuperAdmin = require('../middleware/requireSuperAdmin');

router.get('/test-admin', requireAuth, requireSuperAdmin, (req, res) => {
  res.json({ message: 'Super admin access OK!', user: req.user });
});
```

**Testar:**
```bash
# Login como super_admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}' \
  | jq -r '.tokens.accessToken')

# Testar rota (DEVE FUNCIONAR)
curl -X GET http://localhost:3010/api/v1/devices/test-admin \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Deve retornar: {"message": "Super admin access OK!", ...}
```

---

## 🔒 7. Testar Bloqueio de Acesso

```bash
# Login como tenant_admin (se existir outro usuário)
TENANT_TOKEN=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"outro@example.com","password":"senha123"}' \
  | jq -r '.tokens.accessToken')

# Tentar acessar rota admin (DEVE FALHAR)
curl -X GET http://localhost:3010/api/v1/devices/test-admin \
  -H "Authorization: Bearer $TENANT_TOKEN"

# Deve retornar 403:
# {
#   "error": "Access denied. Super admin privileges required.",
#   "requiredRole": "super_admin",
#   "currentRole": "tenant_admin"
# }
```

---

## 📊 8. Verificar Logs

```bash
# Ver logs do backend
tail -f ~/easysmart-platform/backend/logs/app.log

# Procurar por:
# - "Login realizado" com campo "role"
# - "Unauthorized admin access attempt" quando tenant tenta acessar admin
# - "Super admin access granted" quando admin acessa
```

---

## ✅ 9. Checklist Final

- [ ] Migration executada
- [ ] Coluna `role` existe no banco
- [ ] Admin é `super_admin`
- [ ] JWT contém `role`
- [ ] Middleware bloqueia non-admin
- [ ] Middleware permite super_admin
- [ ] Logs registram acessos

---

## 🚨 Troubleshooting

### Problema: Migration falha com erro de sintaxe
```bash
# Verificar se o arquivo está correto
cat ~/easysmart-platform/backend/migrations/1760738000000_add-role-to-users.js

# Deve começar com: exports.up = async (pgm) => {
```

### Problema: JWT não contém role
```bash
# Verificar authController.js
cat ~/easysmart-platform/backend/src/controllers/authController.js | grep -A5 "generateAccessToken"

# Deve ter:
# const accessToken = generateAccessToken({
#   userId: user.id,
#   tenantId: user.tenant_id,
#   role: user.role,  ← DEVE EXISTIR
# });
```

### Problema: Middleware não bloqueia acesso
```bash
# Verificar se middleware foi aplicado
cat ~/easysmart-platform/backend/src/routes/admin.js

# Deve ter:
# const requireSuperAdmin = require('../middleware/requireSuperAdmin');
# router.use(requireAuth);
# router.use(requireSuperAdmin);  ← CRÍTICO
```

---

## 🎯 Próximos Passos

Após validar tudo acima:

1. **Remover rota de teste** (`/test-admin`)
2. **Criar adminController.js** (Sprint 2)
3. **Criar rotas admin** (Sprint 2)
4. **Testar todas rotas admin** (Sprint 2)
5. **Atualizar frontend** (Sprint 3)

---

## 📝 Comandos Úteis

```bash
# Restart backend (se necessário)
cd ~/easysmart-platform/backend
npm run dev

# Ver processos Node rodando
ps aux | grep node

# Limpar logs
> ~/easysmart-platform/backend/logs/app.log

# Backup do banco antes de migration
docker exec postgres pg_dump -U postgres easysmart > backup_pre_roles.sql
```

---

**Data:** 2025-10-17  
**Phase:** 2.1.5 - Sprint 1  
**Status:** Pronto para executar!
