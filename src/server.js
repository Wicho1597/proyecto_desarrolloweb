const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { getConnection, closeConnection } = require('./config/database');

// Inicializar Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIO(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Hacer io accesible en las rutas
app.set('io', io);

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const pacientesRoutes = require('./routes/pacientesRoutes');
const clinicasRoutes = require('./routes/clinicasRoutes');
const turnosRoutes = require('./routes/turnosRoutes');

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/clinicas', clinicasRoutes);
app.use('/api/turnos', turnosRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Rutas para las vistas
app.get('/preclasificacion', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/preclasificacion.html'));
});

app.get('/medico', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/medico.html'));
});

app.get('/display', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/display.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Manejo de WebSockets
io.on('connection', (socket) => {
    console.log('✓ Cliente conectado:', socket.id);

    // Unirse a una sala específica (por clínica)
    socket.on('join-clinica', (clinicaId) => {
        socket.join(`clinica-${clinicaId}`);
        console.log(`Socket ${socket.id} se unió a la clínica ${clinicaId}`);
    });

    // Unirse a la sala de display general
    socket.on('join-display', () => {
        socket.join('display');
        console.log(`Socket ${socket.id} se unió al display general`);
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log('✗ Cliente desconectado:', socket.id);
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Ruta 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// Puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        await getConnection();

        // Iniciar servidor
        server.listen(PORT, () => {
            console.log('================================================');
            console.log(`✓ Servidor corriendo en puerto ${PORT}`);
            console.log(`✓ Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ URL: http://localhost:${PORT}`);
            console.log('================================================');
        });
    } catch (error) {
        console.error('✗ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Cerrando servidor...');
    await closeConnection();
    process.exit(0);
});

// Iniciar
startServer();

module.exports = { app, io };
