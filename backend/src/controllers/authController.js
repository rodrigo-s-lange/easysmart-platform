'use strict';

const bcrypt = require('bcrypt');
const { z } = require('zod');
const { pool } = require('../config/database');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} = require('../utils/token');

// ==================== SCHEMAS DE VALIDAÇÃO ====================

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantName: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().startsWith('rt_'),
});

// ==================== HELPERS ====================

async function findUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

async function insertUser({ tenant_id, email, password_hash, role = 'user' }) {
  const res = await pool.query(
    `INSERT INTO users (tenant_id, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, tenant_id, email, role, created_at`,
    [tenant_id, email, password_hash, role]
  );
  return res.rows[0];
}

async function createTenant(name) {
  const res = await pool.query(
    'INSERT INTO tenants (name) VALUES ($1) RETURNING id, name',
    [name]
  );
  return res.rows[0];
}

async function storeRefreshToken(userId, token) {
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

async function deleteRefreshToken(token) {
  const tokenHash = hashToken(token);
  await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

// ==================== CONTROLLERS ====================

exports.register = async (req, res) => {
  try {
    const { email, password, tenantName } = registerSchema.parse(req.body);

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Cria tenant se não existir
    const tenant = await createTenant(tenantName || email.split('@')[0]);

    const user = await insertUser({
      tenant_id: tenant.id,
      email,
      password_hash,
      role: 'admin',
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    return res.status(201).json({
      user,
      tokens: { accessToken, refreshToken },
    });
  } catch (err) {
    console.error('register error', err);
    return res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await findUserByEmail(email);

    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    return res.json({
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        email: user.email,
        role: user.role,
      },
      tokens: { accessToken, refreshToken },
    });
  } catch (err) {
    console.error('login error', err);
    return res.status(400).json({ message: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const tokenHash = hashToken(refreshToken);

    const resToken = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );
    const record = resToken.rows[0];

    if (!record) return res.status(403).json({ message: 'Invalid or expired refresh token' });

    const userRes = await pool.query('SELECT id, tenant_id, role FROM users WHERE id = $1', [
      record.user_id,
    ]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });

    return res.json({ accessToken });
  } catch (err) {
    console.error('refresh error', err);
    return res.status(400).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    await deleteRefreshToken(refreshToken);
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('logout error', err);
    return res.status(400).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const { user } = req;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    const dbRes = await pool.query(
      'SELECT id, tenant_id, email, role, created_at FROM users WHERE id = $1',
      [user.userId]
    );
    const userData = dbRes.rows[0];
    if (!userData) return res.status(404).json({ message: 'User not found' });

    return res.json(userData);
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ message: 'Internal error' });
  }
};
