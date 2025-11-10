-- =============================================
-- Script de Creación de Base de Datos
-- Sistema de Gestión de Turnos Hospitalarios
-- =============================================

-- Crear la base de datos
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'HospitalTurnos')
BEGIN
    CREATE DATABASE HospitalTurnos;
    PRINT 'Base de datos HospitalTurnos creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La base de datos HospitalTurnos ya existe.';
END
GO

-- Usar la base de datos
USE HospitalTurnos;
GO

-- =============================================
-- TABLA: Usuarios (Médicos y Personal)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        UsuarioID INT IDENTITY(1,1) PRIMARY KEY,
        NombreCompleto NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100) UNIQUE NOT NULL,
        Password NVARCHAR(255) NOT NULL,
        Rol NVARCHAR(20) NOT NULL CHECK (Rol IN ('admin', 'medico', 'recepcion')),
        Especialidad NVARCHAR(100) NULL,
        Activo BIT DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        UltimaActualizacion DATETIME DEFAULT GETDATE()
    );
    PRINT 'Tabla Usuarios creada exitosamente.';
END
GO

-- =============================================
-- TABLA: Clínicas/Consultorios
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clinicas')
BEGIN
    CREATE TABLE Clinicas (
        ClinicaID INT IDENTITY(1,1) PRIMARY KEY,
        NombreClinica NVARCHAR(100) NOT NULL,
        Descripcion NVARCHAR(255) NULL,
        MedicoAsignadoID INT NULL,
        Activo BIT DEFAULT 1,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (MedicoAsignadoID) REFERENCES Usuarios(UsuarioID)
    );
    PRINT 'Tabla Clinicas creada exitosamente.';
END
GO

-- =============================================
-- TABLA: Pacientes
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pacientes')
BEGIN
    CREATE TABLE Pacientes (
        PacienteID INT IDENTITY(1,1) PRIMARY KEY,
        NombreCompleto NVARCHAR(100) NOT NULL,
        DPI NVARCHAR(20) UNIQUE NULL,
        FechaNacimiento DATE NULL,
        Telefono NVARCHAR(20) NULL,
        Direccion NVARCHAR(255) NULL,
        FechaRegistro DATETIME DEFAULT GETDATE()
    );
    PRINT 'Tabla Pacientes creada exitosamente.';
END
GO

-- =============================================
-- TABLA: Turnos
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Turnos')
BEGIN
    CREATE TABLE Turnos (
        TurnoID INT IDENTITY(1,1) PRIMARY KEY,
        NumeroTurno INT NOT NULL,
        PacienteID INT NOT NULL,
        ClinicaID INT NOT NULL,
        Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('espera', 'atendiendo', 'finalizado', 'ausente')),
        MotivoConsulta NVARCHAR(255) NULL,
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaLlamado DATETIME NULL,
        FechaFinalizacion DATETIME NULL,
        CreadoPorID INT NOT NULL,
        FOREIGN KEY (PacienteID) REFERENCES Pacientes(PacienteID),
        FOREIGN KEY (ClinicaID) REFERENCES Clinicas(ClinicaID),
        FOREIGN KEY (CreadoPorID) REFERENCES Usuarios(UsuarioID)
    );
    PRINT 'Tabla Turnos creada exitosamente.';
END
GO

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

-- Índice para búsqueda de turnos por estado
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Turnos_Estado')
BEGIN
    CREATE INDEX IX_Turnos_Estado ON Turnos(Estado);
    PRINT 'Índice IX_Turnos_Estado creado.';
END
GO

-- Índice para búsqueda de turnos por clínica
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Turnos_Clinica')
BEGIN
    CREATE INDEX IX_Turnos_Clinica ON Turnos(ClinicaID);
    PRINT 'Índice IX_Turnos_Clinica creado.';
END
GO

-- Índice para búsqueda de turnos por fecha
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Turnos_Fecha')
BEGIN
    CREATE INDEX IX_Turnos_Fecha ON Turnos(FechaCreacion);
    PRINT 'Índice IX_Turnos_Fecha creado.';
END
GO

-- =============================================
-- DATOS INICIALES: Usuario Administrador
-- =============================================

-- Contraseña: admin123 (hasheada con bcrypt)
-- NOTA: Deberás cambiar este hash por uno real generado con bcrypt
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Email = 'admin@hospital.com')
BEGIN
    INSERT INTO Usuarios (NombreCompleto, Email, Password, Rol, Activo)
    VALUES ('Administrador del Sistema', 'admin@hospital.com', '$2a$10$rO5B7zB8h5wV5wH5wH5wH5wH5wH5wH5wH5wH5wH5wH5wH5wH5wH5w', 'admin', 1);
    PRINT 'Usuario administrador creado.';
END
GO

-- =============================================
-- DATOS INICIALES: Clínicas de Ejemplo
-- =============================================

IF NOT EXISTS (SELECT * FROM Clinicas WHERE NombreClinica = 'Medicina General')
BEGIN
    INSERT INTO Clinicas (NombreClinica, Descripcion, Activo)
    VALUES 
        ('Medicina General', 'Consultas de medicina general', 1),
        ('Pediatría', 'Atención pediátrica', 1),
        ('Cardiología', 'Especialidad en enfermedades del corazón', 1),
        ('Traumatología', 'Atención de lesiones y fracturas', 1);
    PRINT 'Clínicas de ejemplo creadas.';
END
GO

-- =============================================
-- VISTA: Turnos Activos del Día
-- =============================================

IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_TurnosActivos')
BEGIN
    DROP VIEW vw_TurnosActivos;
END
GO

CREATE VIEW vw_TurnosActivos AS
SELECT 
    t.TurnoID,
    t.NumeroTurno,
    p.NombreCompleto AS NombrePaciente,
    c.NombreClinica,
    t.Estado,
    t.MotivoConsulta,
    t.FechaCreacion,
    t.FechaLlamado,
    u.NombreCompleto AS CreadoPor
FROM Turnos t
INNER JOIN Pacientes p ON t.PacienteID = p.PacienteID
INNER JOIN Clinicas c ON t.ClinicaID = c.ClinicaID
INNER JOIN Usuarios u ON t.CreadoPorID = u.UsuarioID
WHERE CAST(t.FechaCreacion AS DATE) = CAST(GETDATE() AS DATE)
  AND t.Estado IN ('espera', 'atendiendo');
GO

PRINT 'Vista vw_TurnosActivos creada.';
GO

-- =============================================
-- PROCEDIMIENTO ALMACENADO: Generar Número de Turno
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GenerarNumeroTurno')
BEGIN
    DROP PROCEDURE sp_GenerarNumeroTurno;
END
GO

CREATE PROCEDURE sp_GenerarNumeroTurno
    @ClinicaID INT,
    @NumeroTurno INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FechaHoy DATE = CAST(GETDATE() AS DATE);
    
    -- Obtener el último número de turno del día para la clínica
    SELECT @NumeroTurno = ISNULL(MAX(NumeroTurno), 0) + 1
    FROM Turnos
    WHERE ClinicaID = @ClinicaID
      AND CAST(FechaCreacion AS DATE) = @FechaHoy;
      
    RETURN @NumeroTurno;
END
GO

PRINT 'Procedimiento sp_GenerarNumeroTurno creado.';
GO

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

PRINT '================================================';
PRINT 'Base de datos HospitalTurnos configurada completamente.';
PRINT 'Tablas creadas: Usuarios, Clinicas, Pacientes, Turnos';
PRINT 'Vistas creadas: vw_TurnosActivos';
PRINT 'Procedimientos: sp_GenerarNumeroTurno';
PRINT '================================================';
GO

-- Mostrar información de las tablas creadas
SELECT 
    TABLE_NAME AS 'Tabla',
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) AS 'Columnas'
FROM INFORMATION_SCHEMA.TABLES t
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_CATALOG = 'HospitalTurnos'
ORDER BY TABLE_NAME;
GO