const bcrypt = require('bcryptjs');
const { getConnection, sql } = require('../config/database');
const { generateToken } = require('../utils/jwtHelper');

/**
 * Login de usuario
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos de entrada
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Obtener conexión
        const pool = await getConnection();

        // Buscar usuario por email
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT
                    UsuarioID,
                    NombreCompleto,
                    Email,
                    Password,
                    Rol,
                    Especialidad,
                    Activo
                FROM Usuarios
                WHERE Email = @email
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const usuario = result.recordset[0];

        // Verificar si el usuario está activo
        if (!usuario.Activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, usuario.Password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = generateToken({
            usuarioId: usuario.UsuarioID,
            email: usuario.Email,
            rol: usuario.Rol,
            nombreCompleto: usuario.NombreCompleto
        });

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                usuario: {
                    usuarioId: usuario.UsuarioID,
                    nombreCompleto: usuario.NombreCompleto,
                    email: usuario.Email,
                    rol: usuario.Rol,
                    especialidad: usuario.Especialidad
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Registro de nuevo usuario (solo admin)
 */
const registro = async (req, res) => {
    try {
        const { nombreCompleto, email, password, rol, especialidad } = req.body;

        // Validar datos de entrada
        if (!nombreCompleto || !email || !password || !rol) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar rol
        const rolesValidos = ['admin', 'medico', 'recepcion'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido'
            });
        }

        // Obtener conexión
        const pool = await getConnection();

        // Verificar si el email ya existe
        const emailExiste = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT UsuarioID FROM Usuarios WHERE Email = @email');

        if (emailExiste.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar usuario
        const result = await pool.request()
            .input('nombreCompleto', sql.NVarChar, nombreCompleto)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, passwordHash)
            .input('rol', sql.NVarChar, rol)
            .input('especialidad', sql.NVarChar, especialidad || null)
            .query(`
                INSERT INTO Usuarios (NombreCompleto, Email, Password, Rol, Especialidad, Activo)
                OUTPUT INSERTED.UsuarioID, INSERTED.NombreCompleto, INSERTED.Email, INSERTED.Rol
                VALUES (@nombreCompleto, @email, @password, @rol, @especialidad, 1)
            `);

        const nuevoUsuario = result.recordset[0];

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                usuarioId: nuevoUsuario.UsuarioID,
                nombreCompleto: nuevoUsuario.NombreCompleto,
                email: nuevoUsuario.Email,
                rol: nuevoUsuario.Rol
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener información del usuario actual
 */
const getUsuarioActual = async (req, res) => {
    try {
        const pool = await getConnection();

        const result = await pool.request()
            .input('usuarioId', sql.Int, req.user.usuarioId)
            .query(`
                SELECT
                    UsuarioID,
                    NombreCompleto,
                    Email,
                    Rol,
                    Especialidad,
                    Activo,
                    FechaCreacion
                FROM Usuarios
                WHERE UsuarioID = @usuarioId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const usuario = result.recordset[0];

        res.json({
            success: true,
            data: {
                usuarioId: usuario.UsuarioID,
                nombreCompleto: usuario.NombreCompleto,
                email: usuario.Email,
                rol: usuario.Rol,
                especialidad: usuario.Especialidad,
                activo: usuario.Activo,
                fechaCreacion: usuario.FechaCreacion
            }
        });

    } catch (error) {
        console.error('Error al obtener usuario actual:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

module.exports = {
    login,
    registro,
    getUsuarioActual
};
