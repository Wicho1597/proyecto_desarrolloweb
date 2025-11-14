const express = require('express');
const router = express.Router();
const turnosController = require('../controllers/turnosController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear un nuevo turno (recepción y médicos)
router.post('/', authorizeRoles('recepcion', 'medico', 'admin'), turnosController.crearTurno);

// Obtener turnos activos del día
router.get('/activos', turnosController.obtenerTurnosActivos);

// Obtener historial de turnos
router.get('/historial', turnosController.obtenerHistorial);

// Obtener turno actual de una clínica
router.get('/clinica/:clinicaId/actual', turnosController.obtenerTurnoActual);

// Llamar al siguiente turno (solo médicos)
router.post('/llamar', authorizeRoles('medico', 'admin'), turnosController.llamarSiguienteTurno);

// Finalizar un turno (solo médicos)
router.put('/:turnoId/finalizar', authorizeRoles('medico', 'admin'), turnosController.finalizarTurno);

// Marcar turno como ausente (solo médicos)
router.put('/:turnoId/ausente', authorizeRoles('medico', 'admin'), turnosController.marcarAusente);

module.exports = router;
