'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

// ==================== ROUTES ====================

// Registro de novo usuário + tenant
router.post('/register', authController.register);

// Login (gera access + refresh tokens)
router.post('/login', authController.login);

// Atualização de token de acesso via refresh token
router.post('/refresh', authController.refresh);

// Logout (revoga refresh token)
router.post('/logout', authController.logout);

// Retorna informações do usuário autenticado
router.get('/users/me', requireAuth, authController.me);

module.exports = router;
