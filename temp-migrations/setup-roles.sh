#!/bin/bash
# Script de setup da Phase 2.1.5 - Role System
# Execute este script no servidor

set -e  # Para na primeira falha

echo "=========================================="
echo "🚀 EasySmart - Phase 2.1.5: Role System"
echo "=========================================="
echo ""

# 1. Mover migration
echo "📁 [1/6] Movendo migration para diretório correto..."
cp ~/Downloads/1760738000000_add-role-to-users.js ~/easysmart-platform/backend/migrations/
echo "✅ Migration copiada!"
echo ""

# 2. Executar migration
echo "🗄️  [2/6] Executando migration..."
cd ~/easysmart-platform/backend
npm run migrate up
echo "✅ Migration executada!"
echo ""

# 3. Validar coluna no banco
echo "🔍 [3/6] Validando coluna 'role' no banco..."
docker exec -it postgres psql -U postgres -d easysmart -c "
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';
"
echo ""

# 4. Verificar usuários e roles
echo "👥 [4/6] Listando usuários e roles..."
docker exec -it postgres psql -U postgres -d easysmart -c "
SELECT id, email, role, tenant_id, created_at 
FROM users 
ORDER BY created_at;
"
echo ""

# 5. Testar login admin
echo "🔐 [5/6] Testando login do super_admin..."
RESPONSE=$(curl -s -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@easysmart.io","password":"admin123456"}')

echo "$RESPONSE" | jq '.'

ROLE=$(echo "$RESPONSE" | jq -r '.user.role')
if [ "$ROLE" == "super_admin" ]; then
  echo "✅ Login como super_admin OK!"
else
  echo "❌ ERRO: Role esperado 'super_admin', recebido '$ROLE'"
  exit 1
fi
echo ""

# 6. Extrair token para próximos testes
echo "🎫 [6/6] Extraindo access token..."
ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.tokens.accessToken')
echo "Token extraído (primeiros 20 chars): ${ACCESS_TOKEN:0:20}..."
echo ""

# Salvar token em arquivo temporário
echo "$ACCESS_TOKEN" > /tmp/easysmart_admin_token.txt
echo "💾 Token salvo em /tmp/easysmart_admin_token.txt"
echo ""

echo "=========================================="
echo "✅ Setup da Phase 2.1.5 concluído!"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo "   → Criar adminController.js"
echo "   → Implementar rotas admin"
echo "   → Testar middleware requireSuperAdmin"
echo ""
echo "🔑 Para usar o token admin:"
echo "   export ADMIN_TOKEN=\$(cat /tmp/easysmart_admin_token.txt)"
echo "   curl -H \"Authorization: Bearer \$ADMIN_TOKEN\" http://localhost:3010/api/v1/admin/tenants"
echo ""
