const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.post('/registro', authenticateToken, authorizeRoles('admin'), authController.registro);
router.get('/me', authenticateToken, authController.getUsuarioActual);

module.exports = router;
