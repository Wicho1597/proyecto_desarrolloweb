# Sistema Visual de Cola de Turnos para Pacientes

Sistema completo de gestión de turnos hospitalarios con actualización en tiempo real, desarrollado con Node.js, Express, Socket.IO y SQL Server.

## Descripción del Proyecto

Este sistema permite a hospitales, clínicas y centros de salud gestionar eficientemente la atención de pacientes mediante:

- **Preclasificación/Triaje**: Asignación de pacientes a clínicas específicas por personal médico
- **Panel Médico**: Control del flujo de atención, llamado de turnos y gestión de consultas
- **Display en Tiempo Real**: Pantalla informativa para que los pacientes visualicen los turnos
- **Autenticación JWT**: Seguridad y control de acceso basado en roles

## Características Principales

- ✅ Módulo de preclasificación para registro y asignación de pacientes
- ✅ Panel de control para médicos con gestión de turnos
- ✅ Pantalla informativa en tiempo real para áreas de espera
- ✅ Actualización automática mediante WebSockets
- ✅ Autenticación segura con JSON Web Tokens (JWT)
- ✅ Gestión de múltiples clínicas/consultorios
- ✅ Estadísticas y reportes del día
- ✅ Historial de turnos
- ✅ Gestión de pacientes

## Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- Socket.IO (WebSockets)
- SQL Server (mssql)
- JWT (jsonwebtoken)
- bcryptjs

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Socket.IO Client

## Estructura del Proyecto

```
proyecto_desarrolloweb/
├── database/
│   └── database.sql           # Script de creación de base de datos
├── src/
│   ├── config/
│   │   └── database.js        # Configuración de SQL Server
│   ├── controllers/           # Controladores de la API
│   │   ├── authController.js
│   │   ├── clinicasController.js
│   │   ├── pacientesController.js
│   │   ├── turnosController.js
│   │   └── usuariosController.js
│   ├── middlewares/           # Middlewares de autenticación
│   │   └── authMiddleware.js
│   ├── routes/                # Rutas de la API
│   │   ├── authRoutes.js
│   │   ├── clinicasRoutes.js
│   │   ├── pacientesRoutes.js
│   │   ├── turnosRoutes.js
│   │   └── usuariosRoutes.js
│   ├── utils/                 # Utilidades
│   │   └── jwtHelper.js
│   └── server.js              # Servidor principal
├── public/
│   └── css/
│       └── styles.css         # Estilos globales
├── views/                     # Vistas HTML
│   ├── index.html             # Página de inicio
│   ├── login.html             # Inicio de sesión
│   ├── preclasificacion.html  # Módulo de triaje
│   ├── medico.html            # Panel médico
│   └── display.html           # Pantalla informativa
├── .env                       # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## Instalación y Configuración

### Requisitos Previos

- Node.js (v14 o superior)
- SQL Server (2016 o superior)
- Git

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/proyecto_desarrolloweb.git
cd proyecto_desarrolloweb
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar SQL Server

1. Abrir SQL Server Management Studio (SSMS)
2. Ejecutar el script `database/database.sql`
3. Verificar que la base de datos `HospitalTurnos` se haya creado correctamente

### Paso 4: Configurar Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=HospitalTurnos
DB_USER=sa
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=*
```

### Paso 5: Generar Hash de Contraseña para Admin

Ejecutar este script para generar el hash de la contraseña del administrador:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10, (err, hash) => console.log(hash));"
```

Actualizar el hash en el script `database/database.sql` en la línea 139.

### Paso 6: Iniciar el Servidor

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Uso del Sistema

### Acceso al Sistema

**Usuario Administrador por Defecto:**
- Email: `admin@hospital.com`
- Password: `admin123`

### Roles de Usuario

#### 1. Recepción/Enfermería
- Registro de pacientes
- Asignación de turnos a clínicas
- Búsqueda de pacientes por DPI
- Visualización de turnos activos

**Acceso:** `/preclasificacion`

#### 2. Médico
- Llamado del siguiente turno
- Finalización de consultas
- Marcado de ausencias
- Visualización de cola de espera
- Estadísticas del día

**Acceso:** `/medico`

#### 3. Display Público
- Visualización de turnos en atención
- Próximos turnos por clínica
- Actualización automática en tiempo real

**Acceso:** `/display` (no requiere login)

## API Endpoints

### Autenticación

```
POST   /api/auth/login          # Iniciar sesión
POST   /api/auth/registro       # Registrar usuario (admin)
GET    /api/auth/me             # Obtener usuario actual
```

### Pacientes

```
GET    /api/pacientes           # Obtener todos los pacientes
GET    /api/pacientes/:id       # Obtener paciente por ID
GET    /api/pacientes/dpi/:dpi  # Buscar por DPI
POST   /api/pacientes           # Crear paciente
PUT    /api/pacientes/:id       # Actualizar paciente
```

### Clínicas

```
GET    /api/clinicas            # Obtener todas las clínicas
GET    /api/clinicas/:id        # Obtener clínica por ID
GET    /api/clinicas/:id/estadisticas  # Estadísticas de clínica
POST   /api/clinicas            # Crear clínica (admin)
PUT    /api/clinicas/:id        # Actualizar clínica (admin)
```

### Turnos

```
POST   /api/turnos                      # Crear turno
GET    /api/turnos/activos              # Obtener turnos activos
GET    /api/turnos/historial            # Obtener historial
GET    /api/turnos/clinica/:id/actual   # Turno actual de clínica
POST   /api/turnos/llamar               # Llamar siguiente turno
PUT    /api/turnos/:id/finalizar        # Finalizar turno
PUT    /api/turnos/:id/ausente          # Marcar ausente
```

### Usuarios

```
GET    /api/usuarios            # Obtener todos los usuarios (admin)
GET    /api/usuarios/medicos    # Obtener médicos disponibles
PUT    /api/usuarios/:id        # Actualizar usuario (admin)
POST   /api/usuarios/cambiar-password  # Cambiar contraseña
```

## Base de Datos

### Tablas Principales

- **Usuarios**: Médicos, recepción y administradores
- **Pacientes**: Registro de pacientes
- **Clinicas**: Consultorios y especialidades
- **Turnos**: Turnos de atención

### Estados de Turno

- `espera`: Turno en cola
- `atendiendo`: Turno siendo atendido
- `finalizado`: Consulta finalizada
- `ausente`: Paciente no se presentó

## WebSockets (Eventos en Tiempo Real)

El sistema utiliza Socket.IO para actualizaciones en tiempo real:

- `nuevo-turno`: Cuando se crea un nuevo turno
- `turno-llamado`: Cuando se llama a un turno
- `turno-actualizado`: Cuando cambia el estado de un turno
- `turno-finalizado`: Cuando se finaliza una consulta
- `turno-ausente`: Cuando se marca ausencia

## Deployment

### Variables de Entorno en Producción

Asegurarse de configurar correctamente:

```env
NODE_ENV=production
DB_SERVER=tu_servidor_produccion
JWT_SECRET=secret_super_seguro_produccion
CORS_ORIGIN=https://tu-dominio.com
```

### Servicios de Hosting Recomendados

- **Backend**: Render, Railway, Heroku, Azure
- **Base de Datos**: Azure SQL Database, AWS RDS

### Pasos para Deploy

1. Subir código a GitHub
2. Conectar repositorio con servicio de hosting
3. Configurar variables de entorno
4. Ejecutar script de base de datos en servidor SQL
5. Iniciar aplicación

## Seguridad

- ✅ Autenticación JWT
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Validación de entrada en todos los endpoints
- ✅ Protección de rutas por rol
- ✅ Variables de entorno para datos sensibles
- ✅ SQL parametrizado para prevenir inyección SQL

## Mejoras Futuras

- [ ] Notificaciones push para pacientes
- [ ] Integración con sistemas de historias clínicas
- [ ] Reportes y estadísticas avanzadas
- [ ] App móvil para pacientes
- [ ] Sistema de citas previas
- [ ] Soporte multiidioma

## Autor

Proyecto desarrollado como parte del curso de Desarrollo Web 2025 - Universidad Mariano Gálvez

## Licencia

ISC

## Contacto

Para dudas o sugerencias:
- Email: cillescasd1@miumg.edu.gt (Docente)

---

**Nota**: Este proyecto es parte de la evaluación del curso de Desarrollo Web. El código debe ser desarrollado de manera individual y presentado semanalmente con avances progresivos.
