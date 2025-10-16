'use strict';

const express = require('express');
const router = express.Router();
const {
  getAllDevices,
  getDeviceById,
  getEntitiesByDevice,
  deleteDevice,
} = require('../controllers/deviceApiController');

// Listar todos os devices
router.get('/', getAllDevices);

// Obter detalhes de um device
router.get('/:id', getDeviceById);

// Listar entities de um device
router.get('/:id/entities', getEntitiesByDevice);

// Deletar um device
router.delete('/:id', deleteDevice);

module.exports = router;
