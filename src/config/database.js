const sql = require('mssql');
require('dotenv').config();

// Configuración de la conexión a SQL Server
const config = {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE || 'HospitalTurnos',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false, // Para Azure se debe usar true
        trustServerCertificate: true, // Cambiar según el entorno
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Pool de conexiones global
let poolPromise;

/**
 * Obtiene o crea una conexión al pool de SQL Server
 * @returns {Promise<sql.ConnectionPool>}
 */
const getConnection = async () => {
    try {
        if (!poolPromise) {
            poolPromise = new sql.ConnectionPool(config)
                .connect()
                .then(pool => {
                    console.log('✓ Conectado a SQL Server');
                    return pool;
                })
                .catch(err => {
                    console.error('✗ Error al conectar a SQL Server:', err.message);
                    poolPromise = null;
                    throw err;
                });
        }
        return await poolPromise;
    } catch (error) {
        console.error('Error en getConnection:', error);
        throw error;
    }
};

/**
 * Cierra la conexión al pool
 */
const closeConnection = async () => {
    try {
        if (poolPromise) {
            const pool = await poolPromise;
            await pool.close();
            poolPromise = null;
            console.log('✓ Conexión a SQL Server cerrada');
        }
    } catch (error) {
        console.error('Error al cerrar conexión:', error);
    }
};

// Exportar los módulos necesarios
module.exports = {
    sql,
    getConnection,
    closeConnection,
    config
};
