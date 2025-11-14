const express = require('express');
const router = express.Router();
const clinicasController = require('../controllers/clinicasController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las clínicas
router.get('/', clinicasController.obtenerClinicas);

// Obtener una clínica por ID
router.get('/:id', clinicasController.obtenerClinicaPorId);

// Obtener estadísticas de una clínica
router.get('/:id/estadisticas', clinicasController.obtenerEstadisticasClinica);

// Crear una nueva clínica (solo admin)
router.post('/', authorizeRoles('admin'), clinicasController.crearClinica);

// Actualizar una clínica (solo admin)
router.put('/:id', authorizeRoles('admin'), clinicasController.actualizarClinica);

module.exports = router;
