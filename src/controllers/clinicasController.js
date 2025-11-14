const { getConnection, sql } = require('../config/database');

/**
 * Obtener todas las clínicas
 */
const obtenerClinicas = async (req, res) => {
    try {
        const pool = await getConnection();

        const result = await pool.request().query(`
            SELECT
                c.ClinicaID,
                c.NombreClinica,
                c.Descripcion,
                c.MedicoAsignadoID,
                c.Activo,
                c.FechaCreacion,
                u.NombreCompleto AS MedicoAsignado,
                u.Especialidad
            FROM Clinicas c
            LEFT JOIN Usuarios u ON c.MedicoAsignadoID = u.UsuarioID
            WHERE c.Activo = 1
            ORDER BY c.NombreClinica
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener clínicas:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener una clínica por ID
 */
const obtenerClinicaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('clinicaId', sql.Int, id)
            .query(`
                SELECT
                    c.ClinicaID,
                    c.NombreClinica,
                    c.Descripcion,
                    c.MedicoAsignadoID,
                    c.Activo,
                    c.FechaCreacion,
                    u.NombreCompleto AS MedicoAsignado,
                    u.Especialidad
                FROM Clinicas c
                LEFT JOIN Usuarios u ON c.MedicoAsignadoID = u.UsuarioID
                WHERE c.ClinicaID = @clinicaId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Clínica no encontrada'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener clínica:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Crear una nueva clínica
 */
const crearClinica = async (req, res) => {
    try {
        const { nombreClinica, descripcion, medicoAsignadoId } = req.body;

        if (!nombreClinica) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de la clínica es requerido'
            });
        }

        const pool = await getConnection();

        const result = await pool.request()
            .input('nombreClinica', sql.NVarChar, nombreClinica)
            .input('descripcion', sql.NVarChar, descripcion || null)
            .input('medicoAsignadoId', sql.Int, medicoAsignadoId || null)
            .query(`
                INSERT INTO Clinicas (NombreClinica, Descripcion, MedicoAsignadoID, Activo)
                OUTPUT INSERTED.*
                VALUES (@nombreClinica, @descripcion, @medicoAsignadoId, 1)
            `);

        res.status(201).json({
            success: true,
            message: 'Clínica creada exitosamente',
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear clínica:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Actualizar una clínica
 */
const actualizarClinica = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreClinica, descripcion, medicoAsignadoId, activo } = req.body;

        const pool = await getConnection();

        const result = await pool.request()
            .input('clinicaId', sql.Int, id)
            .input('nombreClinica', sql.NVarChar, nombreClinica)
            .input('descripcion', sql.NVarChar, descripcion || null)
            .input('medicoAsignadoId', sql.Int, medicoAsignadoId || null)
            .input('activo', sql.Bit, activo !== undefined ? activo : true)
            .query(`
                UPDATE Clinicas
                SET
                    NombreClinica = @nombreClinica,
                    Descripcion = @descripcion,
                    MedicoAsignadoID = @medicoAsignadoId,
                    Activo = @activo
                OUTPUT INSERTED.*
                WHERE ClinicaID = @clinicaId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Clínica no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Clínica actualizada exitosamente',
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar clínica:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener estadísticas de una clínica
 */
const obtenerEstadisticasClinica = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('clinicaId', sql.Int, id)
            .query(`
                SELECT
                    COUNT(CASE WHEN Estado = 'espera' THEN 1 END) AS EnEspera,
                    COUNT(CASE WHEN Estado = 'atendiendo' THEN 1 END) AS EnAtencion,
                    COUNT(CASE WHEN Estado = 'finalizado' THEN 1 END) AS Finalizados,
                    COUNT(CASE WHEN Estado = 'ausente' THEN 1 END) AS Ausentes,
                    COUNT(*) AS Total
                FROM Turnos
                WHERE ClinicaID = @clinicaId
                  AND CAST(FechaCreacion AS DATE) = CAST(GETDATE() AS DATE)
            `);

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerClinicas,
    obtenerClinicaPorId,
    crearClinica,
    actualizarClinica,
    obtenerEstadisticasClinica
};
