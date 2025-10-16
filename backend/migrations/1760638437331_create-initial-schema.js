/* eslint-disable camelcase */
exports.shorthands = undefined;

exports.up = pgm => {
  // 1. TENANTS
  pgm.createTable('tenants', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    updated_at: { type: 'timestamp', default: pgm.func('NOW()') }
  });

  // 2. USERS
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    tenant_id: { type: 'uuid', references: '"tenants"', onDelete: 'CASCADE' },
    email: { type: 'text', unique: true, notNull: true },
    password_hash: { type: 'text', notNull: true },
    role: { type: 'text', default: 'user' }, // 'admin', 'user', 'viewer'
    created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    updated_at: { type: 'timestamp', default: pgm.func('NOW()') }
  });
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'tenant_id');

  // 3. DEVICE_TEMPLATES
  pgm.createTable('device_templates', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    esphome_config: { type: 'jsonb' },
    default_entities: { type: 'jsonb' },
    created_at: { type: 'timestamp', default: pgm.func('NOW()') }
  });

  // 4. DEVICES
  pgm.createTable('devices', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    tenant_id: { type: 'uuid', references: '"tenants"', onDelete: 'CASCADE' },
    template_id: { type: 'uuid', references: '"device_templates"' },
    name: { type: 'text', notNull: true },
    device_token: { type: 'text', unique: true, notNull: true },
    claim_token: { type: 'text', unique: true },
    mac_address: { type: 'text', unique: true },
    status: { type: 'text', default: 'unclaimed' }, // 'unclaimed', 'claimed', 'online', 'offline'
    last_seen: { type: 'timestamp' },
    metadata: { type: 'jsonb' },
    created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    claimed_at: { type: 'timestamp' },
    updated_at: { type: 'timestamp', default: pgm.func('NOW()') }
  });
  pgm.createIndex('devices', 'tenant_id');
  pgm.createIndex('devices', 'status');

  // 5. ENTITIES
  pgm.createTable('entities', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    device_id: { type: 'uuid', references: '"devices"', onDelete: 'CASCADE' },
    entity_type: { type: 'text', notNull: true }, // 'sensor', 'switch', 'binary_sensor'
    entity_id: { type: 'text', notNull: true },
    name: { type: 'text', notNull: true },
    unit: { type: 'text' },
    device_class: { type: 'text' },
    metadata: { type: 'jsonb' },
    created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    updated_at: { type: 'timestamp', default: pgm.func('NOW()') }
  });
  pgm.addConstraint('entities', 'unique_device_entity', { unique: ['device_id', 'entity_id'] });
  pgm.createIndex('entities', 'device_id');

  // 6. REFRESH_TOKENS
  pgm.createTable('refresh_tokens', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', references: '"users"', onDelete: 'CASCADE' },
    token_hash: { type: 'text', unique: true, notNull: true },
    expires_at: { type: 'timestamp', notNull: true },
    created_at: { type: 'timestamp', default: pgm.func('NOW()') }
  });
  pgm.createIndex('refresh_tokens', 'user_id');
};

exports.down = pgm => {
  pgm.dropTable('refresh_tokens');
  pgm.dropTable('entities');
  pgm.dropTable('devices');
  pgm.dropTable('device_templates');
  pgm.dropTable('users');
  pgm.dropTable('tenants');
};

