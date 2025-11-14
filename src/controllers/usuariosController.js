const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Obtener todos los usuarios
 */
const obtenerUsuarios = async (req, res) => {
    try {
        const pool = await getConnection();

        const result = await pool.request().query(`
            SELECT
                UsuarioID,
                NombreCompleto,
                Email,
                Rol,
                Especialidad,
                Activo,
                FechaCreacion
            FROM Usuarios
            ORDER BY NombreCompleto
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener médicos disponibles
 */
const obtenerMedicos = async (req, res) => {
    try {
        const pool = await getConnection();

        const result = await pool.request().query(`
            SELECT
                UsuarioID,
                NombreCompleto,
                Email,
                Especialidad
            FROM Usuarios
            WHERE Rol = 'medico' AND Activo = 1
            ORDER BY NombreCompleto
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener médicos:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Actualizar un usuario
 */
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreCompleto, email, rol, especialidad, activo } = req.body;

        const pool = await getConnection();

        const result = await pool.request()
            .input('usuarioId', sql.Int, id)
            .input('nombreCompleto', sql.NVarChar, nombreCompleto)
            .input('email', sql.NVarChar, email)
            .input('rol', sql.NVarChar, rol)
            .input('especialidad', sql.NVarChar, especialidad || null)
            .input('activo', sql.Bit, activo !== undefined ? activo : true)
            .query(`
                UPDATE Usuarios
                SET
                    NombreCompleto = @nombreCompleto,
                    Email = @email,
                    Rol = @rol,
                    Especialidad = @especialidad,
                    Activo = @activo,
                    UltimaActualizacion = GETDATE()
                OUTPUT INSERTED.UsuarioID, INSERTED.NombreCompleto, INSERTED.Email, INSERTED.Rol
                WHERE UsuarioID = @usuarioId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Cambiar contraseña
 */
const cambiarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;
        const usuarioId = req.user.usuarioId;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva son requeridas'
            });
        }

        const pool = await getConnection();

        // Obtener contraseña actual
        const usuario = await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .query('SELECT Password FROM Usuarios WHERE UsuarioID = @usuarioId');

        if (usuario.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const passwordValida = await bcrypt.compare(passwordActual, usuario.recordset[0].Password);

        if (!passwordValida) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Hash de la nueva contraseña
        const passwordHash = await bcrypt.hash(passwordNueva, 10);

        // Actualizar contraseña
        await pool.request()
            .input('usuarioId', sql.Int, usuarioId)
            .input('password', sql.NVarChar, passwordHash)
            .query(`
                UPDATE Usuarios
                SET Password = @password, UltimaActualizacion = GETDATE()
                WHERE UsuarioID = @usuarioId
            `);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerMedicos,
    actualizarUsuario,
    cambiarPassword
};
