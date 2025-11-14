const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todos los usuarios (solo admin)
router.get('/', authorizeRoles('admin'), usuariosController.obtenerUsuarios);

// Obtener médicos disponibles
router.get('/medicos', usuariosController.obtenerMedicos);

// Actualizar usuario (solo admin)
router.put('/:id', authorizeRoles('admin'), usuariosController.actualizarUsuario);

// Cambiar contraseña (usuario autenticado)
router.post('/cambiar-password', usuariosController.cambiarPassword);

module.exports = router;
