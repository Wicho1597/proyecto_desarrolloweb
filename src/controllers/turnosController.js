const { getConnection, sql } = require('../config/database');

/**
 * Crear un nuevo turno (Preclasificación)
 */
const crearTurno = async (req, res) => {
    try {
        const { pacienteId, clinicaId, motivoConsulta } = req.body;
        const usuarioId = req.user.usuarioId;

        if (!pacienteId || !clinicaId) {
            return res.status(400).json({
                success: false,
                message: 'Paciente y clínica son requeridos'
            });
        }

        const pool = await getConnection();

        // Generar número de turno usando el procedimiento almacenado
        const numeroTurnoResult = await pool.request()
            .input('ClinicaID', sql.Int, clinicaId)
            .output('NumeroTurno', sql.Int)
            .execute('sp_GenerarNumeroTurno');

        const numeroTurno = numeroTurnoResult.output.NumeroTurno;

        // Insertar el turno
        const result = await pool.request()
            .input('numeroTurno', sql.Int, numeroTurno)
            .input('pacienteId', sql.Int, pacienteId)
            .input('clinicaId', sql.Int, clinicaId)
            .input('estado', sql.NVarChar, 'espera')
            .input('motivoConsulta', sql.NVarChar, motivoConsulta || null)
            .input('creadoPorId', sql.Int, usuarioId)
            .query(`
                INSERT INTO Turnos (NumeroTurno, PacienteID, ClinicaID, Estado, MotivoConsulta, CreadoPorID)
                OUTPUT INSERTED.TurnoID, INSERTED.NumeroTurno, INSERTED.Estado, INSERTED.FechaCreacion
                VALUES (@numeroTurno, @pacienteId, @clinicaId, @estado, @motivoConsulta, @creadoPorId)
            `);

        const turno = result.recordset[0];

        // Obtener información completa del turno creado
        const turnoCompleto = await pool.request()
            .input('turnoId', sql.Int, turno.TurnoID)
            .query(`
                SELECT
                    t.TurnoID,
                    t.NumeroTurno,
                    t.Estado,
                    t.MotivoConsulta,
                    t.FechaCreacion,
                    p.NombreCompleto AS NombrePaciente,
                    p.DPI,
                    c.NombreClinica,
                    c.ClinicaID,
                    u.NombreCompleto AS CreadoPor
                FROM Turnos t
                INNER JOIN Pacientes p ON t.PacienteID = p.PacienteID
                INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
                INNER JOIN Usuarios u ON t.CreadoPorID = u.UsuarioID
                WHERE t.TurnoID = @turnoId
            `);

        // Emitir evento por WebSocket
        const io = req.app.get('io');
        io.emit('nuevo-turno', turnoCompleto.recordset[0]);
        io.to(`clinica-${clinicaId}`).emit('turno-actualizado', turnoCompleto.recordset[0]);

        res.status(201).json({
            success: true,
            message: 'Turno creado exitosamente',
            data: turnoCompleto.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener turnos activos del día
 */
const obtenerTurnosActivos = async (req, res) => {
    try {
        const { clinicaId } = req.query;
        const pool = await getConnection();

        let query = `
            SELECT
                t.TurnoID,
                t.NumeroTurno,
                t.Estado,
                t.MotivoConsulta,
                t.FechaCreacion,
                t.FechaLlamado,
                p.NombreCompleto AS NombrePaciente,
                p.DPI,
                c.NombreClinica,
                c.ClinicaID,
                u.NombreCompleto AS CreadoPor
            FROM Turnos t
            INNER JOIN Pacientes p ON t.PacienteID = p.PacienteID
            INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
            INNER JOIN Usuarios u ON t.CreadoPorID = u.UsuarioID
            WHERE CAST(t.FechaCreacion AS DATE) = CAST(GETDATE() AS DATE)
              AND t.Estado IN ('espera', 'atendiendo')
        `;

        const request = pool.request();

        if (clinicaId) {
            query += ` AND t.ClinicaID = @clinicaId`;
            request.input('clinicaId', sql.Int, clinicaId);
        }

        query += ` ORDER BY t.NumeroTurno ASC`;

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener turnos activos:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Llamar al siguiente turno
 */
const llamarSiguienteTurno = async (req, res) => {
    try {
        const { clinicaId } = req.body;

        if (!clinicaId) {
            return res.status(400).json({
                success: false,
                message: 'La clínica es requerida'
            });
        }

        const pool = await getConnection();

        // Obtener el siguiente turno en espera
        const siguienteTurno = await pool.request()
            .input('clinicaId', sql.Int, clinicaId)
            .query(`
                SELECT TOP 1
                    TurnoID,
                    NumeroTurno
                FROM Turnos
                WHERE ClinicaID = @clinicaId
                  AND Estado = 'espera'
                  AND CAST(FechaCreacion AS DATE) = CAST(GETDATE() AS DATE)
                ORDER BY NumeroTurno ASC
            `);

        if (siguienteTurno.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay turnos en espera'
            });
        }

        const turnoId = siguienteTurno.recordset[0].TurnoID;

        // Actualizar el turno a "atendiendo"
        const result = await pool.request()
            .input('turnoId', sql.Int, turnoId)
            .query(`
                UPDATE Turnos
                SET
                    Estado = 'atendiendo',
                    FechaLlamado = GETDATE()
                OUTPUT
                    INSERTED.TurnoID,
                    INSERTED.NumeroTurno,
                    INSERTED.Estado,
                    INSERTED.FechaLlamado
                WHERE TurnoID = @turnoId
            `);

        // Obtener información completa del turno
        const turnoCompleto = await pool.request()
            .input('turnoId', sql.Int, turnoId)
            .query(`
                SELECT
                    t.TurnoID,
                    t.NumeroTurno,
                    t.Estado,
                    t.MotivoConsulta,
                    t.FechaCreacion,
                    t.FechaLlamado,
                    p.NombreCompleto AS NombrePaciente,
                    p.DPI,
                    c.NombreClinica,
                    c.ClinicaID
                FROM Turnos t
                INNER JOIN Pacientes p ON t.PacienteID = p.PacienteID
                INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
                WHERE t.TurnoID = @turnoId
            `);

        const turnoData = turnoCompleto.recordset[0];

        // Emitir evento por WebSocket
        const io = req.app.get('io');
        io.emit('turno-llamado', turnoData);
        io.to(`clinica-${clinicaId}`).emit('turno-actualizado', turnoData);

        res.json({
            success: true,
            message: 'Turno llamado exitosamente',
            data: turnoData
        });

    } catch (error) {
        console.error('Error al llamar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Finalizar un turno
 */
const finalizarTurno = async (req, res) => {
    try {
        const { turnoId } = req.params;

        const pool = await getConnection();

        const result = await pool.request()
            .input('turnoId', sql.Int, turnoId)
            .query(`
                UPDATE Turnos
                SET
                    Estado = 'finalizado',
                    FechaFinalizacion = GETDATE()
                OUTPUT
                    INSERTED.TurnoID,
                    INSERTED.NumeroTurno,
                    INSERTED.Estado,
                    INSERTED.FechaFinalizacion
                WHERE TurnoID = @turnoId
                  AND Estado = 'atendiendo'
            `);

        if (result.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El turno no está en atención o no existe'
            });
        }

        // Obtener información completa del turno
        const turnoCompleto = await pool.request()
            .input('turnoId', sql.Int, turnoId)
            .query(`
                SELECT
                    t.TurnoID,
                    t.NumeroTurno,
                    t.Estado,
                    t.FechaFinalizacion,
                    c.ClinicaID,
                    c.NombreClinica
                FROM Turnos t
                INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
                WHERE t.TurnoID = @turnoId
            `);

        const turnoData = turnoCompleto.recordset[0];

        // Emitir evento por WebSocket
        const io = req.app.get('io');
        io.emit('turno-finalizado', turnoData);
        io.to(`clinica-${turnoData.ClinicaID}`).emit('turno-actualizado', turnoData);

        res.json({
            success: true,
            message: 'Turno finalizado exitosamente',
            data: turnoData
        });

    } catch (error) {
        console.error('Error al finalizar turno:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Marcar turno como ausente
 */
const marcarAusente = async (req, res) => {
    try {
        const { turnoId } = req.params;

        const pool = await getConnection();

        const result = await pool.request()
            .input('turnoId', sql.Int, turnoId)
            .query(`
                UPDATE Turnos
                SET Estado = 'ausente'
                OUTPUT
                    INSERTED.TurnoID,
                    INSERTED.NumeroTurno,
                    INSERTED.Estado
                WHERE TurnoID = @turnoId
                  AND Estado = 'atendiendo'
            `);

        if (result.recordset.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El turno no está en atención o no existe'
            });
        }

        // Obtener información completa del turno
        const turnoCompleto = await pool.request()
            .input('turnoId', sql.Int, turnoId)
            .query(`
                SELECT
                    t.TurnoID,
                    t.NumeroTurno,
                    t.Estado,
                    c.ClinicaID,
                    c.NombreClinica
                FROM Turnos t
                INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
                WHERE t.TurnoID = @turnoId
            `);

        const turnoData = turnoCompleto.recordset[0];

        // Emitir evento por WebSocket
        const io = req.app.get('io');
        io.emit('turno-ausente', turnoData);
        io.to(`clinica-${turnoData.ClinicaID}`).emit('turno-actualizado', turnoData);

        res.json({
            success: true,
            message: 'Turno marcado como ausente',
            data: turnoData
        });

    } catch (error) {
        console.error('Error al marcar turno como ausente:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener historial de turnos
 */
const obtenerHistorial = async (req, res) => {
    try {
        const { fecha, clinicaId } = req.query;
        const pool = await getConnection();

        let query = `
            SELECT
                t.TurnoID,
                t.NumeroTurno,
                t.Estado,
                t.MotivoConsulta,
                t.FechaCreacion,
                t.FechaLlamado,
                t.FechaFinalizacion,
                p.NombreCompleto AS NombrePaciente,
                c.NombreClinica,
                u.NombreCompleto AS CreadoPor
            FROM Turnos t
            INNER JOIN Pacientes p ON t.PacienteID = p.PacienteID
            INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
            INNER JOIN Usuarios u ON t.CreadoPorID = u.UsuarioID
            WHERE 1=1
        `;

        const request = pool.request();

        if (fecha) {
            query += ` AND CAST(t.FechaCreacion AS DATE) = @fecha`;
            request.input('fecha', sql.Date, fecha);
        } else {
            query += ` AND CAST(t.FechaCreacion AS DATE) = CAST(GETDATE() AS DATE)`;
        }

        if (clinicaId) {
            query += ` AND t.ClinicaID = @clinicaId`;
            request.input('clinicaId', sql.Int, clinicaId);
        }

        query += ` ORDER BY t.FechaCreacion DESC`;

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener turno actual en atención de una clínica
 */
const obtenerTurnoActual = async (req, res) => {
    try {
        const { clinicaId } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('clinicaId', sql.Int, clinicaId)
            .query(`
                SELECT TOP 1
                    t.TurnoID,
                    t.NumeroTurno,
                    t.Estado,
                    t.MotivoConsulta,
                    t.FechaLlamado,
                    p.NombreCompleto AS NombrePaciente,
                    c.NombreClinica
                FROM Turnos t
                INNER JOIN Pacientes p ON t.PacienteID = p.PacienteID
                INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
                WHERE t.ClinicaID = @clinicaId
                  AND t.Estado = 'atendiendo'
                  AND CAST(t.FechaCreacion AS DATE) = CAST(GETDATE() AS DATE)
                ORDER BY t.FechaLlamado DESC
            `);

        res.json({
            success: true,
            data: result.recordset[0] || null
        });

    } catch (error) {
        console.error('Error al obtener turno actual:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

module.exports = {
    crearTurno,
    obtenerTurnosActivos,
    llamarSiguienteTurno,
    finalizarTurno,
    marcarAusente,
    obtenerHistorial,
    obtenerTurnoActual
};
