/**
 * Migration: Create audit_logs table
 * 
 * Tabela para rastreabilidade e compliance.
 * Armazena todas ações críticas do sistema.
 */

exports.up = (pgm) => {
  // Tabela audit_logs
  pgm.createTable('audit_logs', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    event_type: {
      type: 'text',
      notNull: true,
      comment: 'Tipo do evento (auth.login, device.created, etc)',
    },
    user_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
      comment: 'Usuário que executou a ação',
    },
    tenant_id: {
      type: 'uuid',
      references: 'tenants',
      onDelete: 'SET NULL',
      comment: 'Tenant do usuário',
    },
    target_user_id: {
      type: 'uuid',
      references: 'users',
      onDelete: 'SET NULL',
      comment: 'Usuário alvo da ação (se aplicável)',
    },
    target_tenant_id: {
      type: 'uuid',
      references: 'tenants',
      onDelete: 'SET NULL',
      comment: 'Tenant alvo da ação (se aplicável)',
    },
    target_device_id: {
      type: 'uuid',
      references: 'devices',
      onDelete: 'SET NULL',
      comment: 'Device alvo da ação (se aplicável)',
    },
    action: {
      type: 'text',
      notNull: true,
      comment: 'Descrição da ação',
    },
    details: {
      type: 'jsonb',
      default: '{}',
      comment: 'Detalhes adicionais (método, path, query, etc)',
    },
    ip_address: {
      type: 'inet',
      comment: 'IP de origem',
    },
    user_agent: {
      type: 'text',
      comment: 'User agent do cliente',
    },
    success: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Se a ação foi bem-sucedida',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Índices para performance
  pgm.createIndex('audit_logs', 'user_id');
  pgm.createIndex('audit_logs', 'tenant_id');
  pgm.createIndex('audit_logs', 'event_type');
  pgm.createIndex('audit_logs', 'created_at');
  pgm.createIndex('audit_logs', ['tenant_id', 'created_at']);
  pgm.createIndex('audit_logs', ['user_id', 'created_at']);

  // Índice para queries de segurança (falhas)
  pgm.createIndex('audit_logs', 'success', {
    where: 'success = false',
  });

  // Índice para impersonate (compliance crítico)
  pgm.createIndex('audit_logs', 'event_type', {
  name: 'audit_logs_impersonate_index',  // ← Nome único!
  where: "event_type LIKE 'admin.impersonate%'",
});

  // Comentário na tabela
  pgm.sql(`
    COMMENT ON TABLE audit_logs IS 
    'Audit logs para compliance e rastreabilidade. Registra todas ações críticas do sistema.';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('audit_logs');
};
