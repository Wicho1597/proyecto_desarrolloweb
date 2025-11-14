const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todos los pacientes
router.get('/', pacientesController.obtenerPacientes);

// Buscar paciente por DPI
router.get('/dpi/:dpi', pacientesController.buscarPorDPI);

// Obtener un paciente por ID
router.get('/:id', pacientesController.obtenerPacientePorId);

// Crear un nuevo paciente
router.post('/', pacientesController.crearPaciente);

// Actualizar un paciente
router.put('/:id', pacientesController.actualizarPaciente);

module.exports = router;
