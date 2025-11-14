const { verifyToken } = require('../utils/jwtHelper');

/**
 * Middleware para verificar autenticación
 */
const authenticateToken = (req, res, next) => {
    try {
        // Obtener token del header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación no proporcionado'
            });
        }

        // Verificar token
        const decoded = verifyToken(token);

        // Agregar información del usuario a la request
        req.user = {
            usuarioId: decoded.usuarioId,
            email: decoded.email,
            rol: decoded.rol,
            nombreCompleto: decoded.nombreCompleto
        };

        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: error.message || 'Token inválido o expirado'
        });
    }
};

/**
 * Middleware para verificar roles específicos
 * @param  {...string} rolesPermitidos - Roles que tienen acceso
 */
const authorizeRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para acceder a este recurso'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};
