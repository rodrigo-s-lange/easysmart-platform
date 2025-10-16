'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const {
  JWT_SECRET,
  JWT_ACCESS_EXPIRATION = '15m',
  JWT_REFRESH_EXPIRATION = '7d',
} = process.env;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  // Fail fast para evitar tokens fracos em produção
  // Ajuste JWT_SECRET no .env (mínimo 32 chars)
  throw new Error('JWT_SECRET is missing or too short (min 32 chars).');
}

/**
 * Gera um JWT de acesso de curta duração.
 * @param {object} payload - { userId, tenantId, role }
 * @returns {string} token JWT
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRATION,
  });
}

/**
 * Valida e decodifica um JWT de acesso.
 * @param {string} token
 * @returns {object} payload decodificado
 * @throws {Error} se inválido ou expirado
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Gera um refresh token aleatório (não JWT).
 * @returns {string} token opaco
 */
function generateRefreshToken() {
  // 48 bytes -> 96 chars hex; prefixo para facilitar grep em logs
  return 'rt_' + crypto.randomBytes(48).toString('hex');
}

/**
 * Hash seguro para armazenar refresh tokens no banco.
 * @param {string} token
 * @returns {string} hash hex
 */
function hashToken(token) {
  // SHA-256 é suficiente; pode-se trocar para bcrypt se desejar custo computacional
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
};
