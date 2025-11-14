const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Genera un token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} Token JWT
 */
const generateToken = (payload) => {
    try {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    } catch (error) {
        console.error('Error al generar token:', error);
        throw new Error('Error al generar token de autenticación');
    }
};

/**
 * Verifica un token JWT
 * @param {string} token - Token a verificar
 * @returns {Object} Payload del token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expirado');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token inválido');
        }
        throw error;
    }
};

/**
 * Decodifica un token sin verificar su validez
 * @param {string} token - Token a decodificar
 * @returns {Object} Payload del token
 */
const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error('Error al decodificar token:', error);
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken
};
