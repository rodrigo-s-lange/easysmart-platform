const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const deviceController = require('../controllers/deviceController');
const deviceApiController = require('../controllers/deviceApiController');

// Todas as rotas requerem autenticação
router.use(requireAuth);

// Device Management (provisioning, claiming)
router.post('/provision', deviceController.provisionDevice);
router.post('/claim', deviceController.claimDevice);

// Device API (CRUD)
router.get('/', deviceApiController.getDevices);
router.get('/:id', deviceApiController.getDeviceById);
router.get('/:id/entities', deviceApiController.getDeviceEntities);
router.delete('/:id', deviceApiController.deleteDevice);

module.exports = router;