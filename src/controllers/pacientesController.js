const { getConnection, sql } = require('../config/database');

/**
 * Obtener todos los pacientes
 */
const obtenerPacientes = async (req, res) => {
    try {
        const pool = await getConnection();
        const { search } = req.query;

        let query = `
            SELECT
                PacienteID,
                NombreCompleto,
                DPI,
                FechaNacimiento,
                Telefono,
                Direccion,
                FechaRegistro
            FROM Pacientes
        `;

        if (search) {
            query += ` WHERE NombreCompleto LIKE @search OR DPI LIKE @search`;
        }

        query += ` ORDER BY FechaRegistro DESC`;

        const request = pool.request();

        if (search) {
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Obtener un paciente por ID
 */
const obtenerPacientePorId = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('pacienteId', sql.Int, id)
            .query(`
                SELECT
                    PacienteID,
                    NombreCompleto,
                    DPI,
                    FechaNacimiento,
                    Telefono,
                    Direccion,
                    FechaRegistro
                FROM Pacientes
                WHERE PacienteID = @pacienteId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al obtener paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Crear un nuevo paciente
 */
const crearPaciente = async (req, res) => {
    try {
        const { nombreCompleto, dpi, fechaNacimiento, telefono, direccion } = req.body;

        if (!nombreCompleto) {
            return res.status(400).json({
                success: false,
                message: 'El nombre completo es requerido'
            });
        }

        const pool = await getConnection();

        // Verificar si el DPI ya existe (si se proporcionó)
        if (dpi) {
            const dpiExiste = await pool.request()
                .input('dpi', sql.NVarChar, dpi)
                .query('SELECT PacienteID FROM Pacientes WHERE DPI = @dpi');

            if (dpiExiste.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El DPI ya está registrado'
                });
            }
        }

        const result = await pool.request()
            .input('nombreCompleto', sql.NVarChar, nombreCompleto)
            .input('dpi', sql.NVarChar, dpi || null)
            .input('fechaNacimiento', sql.Date, fechaNacimiento || null)
            .input('telefono', sql.NVarChar, telefono || null)
            .input('direccion', sql.NVarChar, direccion || null)
            .query(`
                INSERT INTO Pacientes (NombreCompleto, DPI, FechaNacimiento, Telefono, Direccion)
                OUTPUT INSERTED.*
                VALUES (@nombreCompleto, @dpi, @fechaNacimiento, @telefono, @direccion)
            `);

        res.status(201).json({
            success: true,
            message: 'Paciente creado exitosamente',
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al crear paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Actualizar un paciente
 */
const actualizarPaciente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombreCompleto, dpi, fechaNacimiento, telefono, direccion } = req.body;

        const pool = await getConnection();

        // Verificar si el paciente existe
        const pacienteExiste = await pool.request()
            .input('pacienteId', sql.Int, id)
            .query('SELECT PacienteID FROM Pacientes WHERE PacienteID = @pacienteId');

        if (pacienteExiste.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        const result = await pool.request()
            .input('pacienteId', sql.Int, id)
            .input('nombreCompleto', sql.NVarChar, nombreCompleto)
            .input('dpi', sql.NVarChar, dpi || null)
            .input('fechaNacimiento', sql.Date, fechaNacimiento || null)
            .input('telefono', sql.NVarChar, telefono || null)
            .input('direccion', sql.NVarChar, direccion || null)
            .query(`
                UPDATE Pacientes
                SET
                    NombreCompleto = @nombreCompleto,
                    DPI = @dpi,
                    FechaNacimiento = @fechaNacimiento,
                    Telefono = @telefono,
                    Direccion = @direccion
                OUTPUT INSERTED.*
                WHERE PacienteID = @pacienteId
            `);

        res.json({
            success: true,
            message: 'Paciente actualizado exitosamente',
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al actualizar paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

/**
 * Buscar paciente por DPI
 */
const buscarPorDPI = async (req, res) => {
    try {
        const { dpi } = req.params;
        const pool = await getConnection();

        const result = await pool.request()
            .input('dpi', sql.NVarChar, dpi)
            .query(`
                SELECT
                    PacienteID,
                    NombreCompleto,
                    DPI,
                    FechaNacimiento,
                    Telefono,
                    Direccion,
                    FechaRegistro
                FROM Pacientes
                WHERE DPI = @dpi
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {
        console.error('Error al buscar paciente por DPI:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor',
            error: error.message
        });
    }
};

module.exports = {
    obtenerPacientes,
    obtenerPacientePorId,
    crearPaciente,
    actualizarPaciente,
    buscarPorDPI
};
