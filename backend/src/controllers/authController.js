const bcrypt = require('bcrypt');
const pool = require('../config/database');
const logger = require('../config/logger');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const { auditLogin, auditLogout } = require('../utils/auditLogger');

// POST /api/v1/auth/register
const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, password, tenant_name } = req.body;

    // Validação básica
    if (!email || !password || !tenant_name) {
      return res.status(400).json({ error: 'Email, password e tenant_name são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    await client.query('BEGIN');

    // Verificar se email já existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Criar tenant
    const tenantResult = await client.query(
      'INSERT INTO tenants (name) VALUES ($1) RETURNING id',
      [tenant_name]
    );
    const tenantId = tenantResult.rows[0].id;

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário (primeiro usuário do tenant é tenant_admin)
    const userResult = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, tenant_id, role, created_at`,
      [tenantId, email, passwordHash, 'tenant_admin']
    );

    const user = userResult.rows[0];

    await client.query('COMMIT');

    // Gerar tokens (incluindo role)
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();

    // Salvar refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Audit log: registro bem-sucedido
    await auditLogin(req, user, true);

    logger.info('Novo usuário registrado', {
      userId: user.id,
      email: user.email,
      tenantId: user.tenant_id,
      role: user.role,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Erro no registro', { error: error.message });
    res.status(500).json({ error: 'Erro ao criar usuário' });
  } finally {
    client.release();
  }
};

// POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário (incluindo role)
    const result = await pool.query(
      'SELECT id, email, password_hash, tenant_id, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Audit log: login falhou (usuário não existe)
      await auditLogin(req, { email }, false);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      // Audit log: login falhou (senha errada)
      await auditLogin(req, user, false);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar tokens (incluindo role)
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();

    // Salvar refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Audit log: login bem-sucedido
    await auditLogin(req, user, true);

    logger.info('Login realizado', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error('Erro no login', { error: error.message });
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

// POST /api/v1/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token é obrigatório' });
    }

    // Buscar refresh token
    const result = await pool.query(
      `SELECT rt.user_id, rt.expires_at, u.tenant_id, u.role 
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const { user_id, expires_at, tenant_id, role } = result.rows[0];

    // Verificar se expirou
    if (new Date(expires_at) < new Date()) {
      await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [refreshToken]);
      return res.status(401).json({ error: 'Refresh token expirado' });
    }

    // Gerar novos tokens (incluindo role)
    const newAccessToken = generateAccessToken({
      userId: user_id,
      tenantId: tenant_id,
      role: role,
    });

    const newRefreshToken = generateRefreshToken();

    // Deletar refresh token antigo e criar novo
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [refreshToken]);

    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user_id, newRefreshToken, newExpiresAt]
    );

    logger.info('Token renovado', { userId: user_id });

    res.json({
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error('Erro ao renovar token', { error: error.message });
    res.status(500).json({ error: 'Erro ao renovar token' });
  }
};

// POST /api/v1/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [refreshToken]);
    }

    // Audit log: logout
    await auditLogout(req);

    logger.info('Logout realizado', { userId: req.user?.userId });

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    logger.error('Erro no logout', { error: error.message });
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
};

// GET /api/v1/auth/users/me
const me = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, tenant_id, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar usuário', { error: error.message });
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};