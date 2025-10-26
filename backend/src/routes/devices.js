/**
 * Device Routes
 */

const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { requireAuth } = require('../middleware/auth');

// Todas as rotas exigem autenticação
router.use(requireAuth);

/**
 * GET /api/v1/devices
 * Lista todos os devices do tenant
 */
router.get('/', deviceController.getDevices);

/**
 * POST /api/v1/devices/provision
 * Provisiona manualmente um novo device
 */
router.post('/provision', deviceController.provisionDevice);

/**
 * GET /api/v1/devices/:id
 * Busca device específico com entities
 */
router.get('/:id', deviceController.getDeviceById);

/**
 * POST /api/v1/devices/:deviceId/command
 * Envia comando para dispositivo
 */
router.post('/:deviceId/command', deviceController.sendCommand);

module.exports = router;
