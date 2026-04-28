const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        initDB();
    }
});

function initDB() {
    db.serialize(() => {
        // Tabla de Usuarios para Autenticación
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT NOT NULL
        )`);

        // Tabla de Programas de Formación
        db.run(`CREATE TABLE IF NOT EXISTS programas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            area TEXT NOT NULL,
            niveles INTEGER NOT NULL,
            cupos INTEGER NOT NULL,
            estado TEXT DEFAULT 'Activo'
        )`);

        // Tabla de Inscripciones
        db.run(`CREATE TABLE IF NOT EXISTS inscripciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            estudiante_nombre TEXT NOT NULL,
            estudiante_email TEXT NOT NULL,
            estudiante_telefono TEXT,
            programa_id INTEGER NOT NULL,
            fecha_inscripcion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(programa_id) REFERENCES programas(id)
        )`);

        // Tabla de Asistencias
        db.run(`CREATE TABLE IF NOT EXISTS asistencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inscripcion_id INTEGER NOT NULL,
            fecha DATE DEFAULT CURRENT_DATE,
            estado TEXT DEFAULT 'Presente',
            FOREIGN KEY(inscripcion_id) REFERENCES inscripciones(id)
        )`);

        // Tabla de Convocatorias
        db.run(`CREATE TABLE IF NOT EXISTS convocatorias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            fecha_cierre DATE NOT NULL,
            estado TEXT DEFAULT 'Activa'
        )`);

        // Tabla de Escenarios (Módulo 2)
        db.run(`CREATE TABLE IF NOT EXISTS escenarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            capacidad INTEGER NOT NULL,
            ubicacion TEXT NOT NULL,
            precio_base REAL,
            estado TEXT DEFAULT 'Activo'
        )`);

        // Tabla de Solicitudes de Escenarios
        db.run(`CREATE TABLE IF NOT EXISTS solicitudes_escenarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            escenario_id INTEGER NOT NULL,
            solicitante_nombre TEXT NOT NULL,
            solicitante_email TEXT NOT NULL,
            fecha_solicitada DATE NOT NULL,
            estado_solicitud TEXT DEFAULT 'Pendiente',
            FOREIGN KEY(escenario_id) REFERENCES escenarios(id)
        )`);

        // Datos semilla para escenarios si está vacía
        db.get('SELECT COUNT(*) as count FROM escenarios', [], (err, row) => {
            if (row && row.count === 0) {
                db.run('INSERT INTO escenarios (nombre, capacidad, ubicacion, precio_base) VALUES (?, ?, ?, ?)', 
                    ['Teatro Principal', 500, 'Piso 1', 1200000]);
                db.run('INSERT INTO escenarios (nombre, capacidad, ubicacion, precio_base) VALUES (?, ?, ?, ?)', 
                    ['Sala de Danza Espejos', 50, 'Piso 2 - Ala Norte', 150000]);
                db.run('INSERT INTO escenarios (nombre, capacidad, ubicacion, precio_base) VALUES (?, ?, ?, ?)', 
                    ['Auditorio Múltiple', 120, 'Piso 3', 350000]);
            }
        });

        // Tabla de Inventarios
        db.run(`CREATE TABLE IF NOT EXISTS inventarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            articulo TEXT NOT NULL,
            categoria TEXT NOT NULL,
            cantidad INTEGER NOT NULL,
            estado TEXT DEFAULT 'Bueno',
            fecha_registro DATE DEFAULT CURRENT_DATE
        )`);

        // Tabla de Contratos de Arrendamiento
        db.run(`CREATE TABLE IF NOT EXISTS contratos_arrendamiento (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            solicitud_id INTEGER NOT NULL,
            precio_final REAL NOT NULL,
            fecha_generacion DATE DEFAULT CURRENT_DATE,
            FOREIGN KEY(solicitud_id) REFERENCES solicitudes_escenarios(id)
        )`);

        // Crear usuario admin por defecto si no existe
        const adminEmail = 'admin@cultura.gov';
        db.get('SELECT id FROM usuarios WHERE email = ?', [adminEmail], async (err, row) => {
            if (!row) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('admin123', salt);
                db.run('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', 
                    ['Administrador General', adminEmail, hashedPassword, 'admin']);
            }
        });
    });
}

// ==========================================
// ENDPOINTS DE LA API
// ==========================================

// Autenticación (Login)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(401).json({ error: 'Credenciales inválidas' });

        // En una app real usaríamos JWT, aquí se hace sencillo
        res.json({ success: true, message: 'Autenticación exitosa', user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
    });
});

// Obtener todos los programas
app.get('/api/programas', (req, res) => {
    db.all('SELECT * FROM programas', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ programas: rows });
    });
});

// Crear un nuevo programa
app.post('/api/programas', (req, res) => {
    const { nombre, area, niveles, cupos } = req.body;
    db.run(`INSERT INTO programas (nombre, area, niveles, cupos) VALUES (?, ?, ?, ?)`,
        [nombre, area, niveles, cupos],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, nombre, area, niveles, cupos, estado: 'Activo' });
        });
});

// Eliminar (o desactivar) un programa
app.delete('/api/programas/:id', (req, res) => {
    db.run(`DELETE FROM programas WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deletedInfo: this.changes });
    });
});

// Crear una inscripción en línea y auto-registrar el usuario para la Fase Extra
app.post('/api/inscripciones', async (req, res) => {
    const { estudiante_nombre, estudiante_email, estudiante_telefono, programa_id } = req.body;
    
    // Inyectar el estudiante a la tabla usuarios (si no existe) para que pueda hacer login posterior
    try {
        db.get('SELECT id FROM usuarios WHERE email = ?', [estudiante_email], async (err, row) => {
            if (!row) {
                // Generamos contraseña igual a su teléfono para fines educativos de Software III
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(estudiante_telefono, salt);
                db.run('INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)', 
                    [estudiante_nombre, estudiante_email, hashedPassword, 'estudiante']);
            }
            
            // Proseguir con la inscripción nativa en el curso
            db.run(`INSERT INTO inscripciones (estudiante_nombre, estudiante_email, estudiante_telefono, programa_id) VALUES (?, ?, ?, ?)`,
                [estudiante_nombre, estudiante_email, estudiante_telefono, programa_id],
                function(err2) {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({ transcacion_id: this.lastID, mensaje: 'Inscripción generada exitosamente' });
                });
        });
    } catch (e) {
        return res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener incripciones por programa (Opcional para admin)
app.get('/api/inscripciones', (req, res) => {
    db.all(`SELECT i.*, p.nombre as programa_nombre FROM inscripciones i 
            JOIN programas p ON i.programa_id = p.id`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ inscripciones: rows });
    });
});

// Obtener inscripciones de un programa específico
app.get('/api/programas/:id/inscripciones', (req, res) => {
    db.all(`SELECT id, estudiante_nombre, estudiante_email, estudiante_telefono, fecha_inscripcion 
            FROM inscripciones WHERE programa_id = ? ORDER BY id DESC`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ inscripciones: rows });
    });
});

// Obtener los cursos matriculados de un *ESTUDIANTE* específico por email
app.get('/api/estudiante/mis-cursos/:email', (req, res) => {
    db.all(`SELECT i.id, i.fecha_inscripcion, p.nombre as programa, p.area 
            FROM inscripciones i 
            JOIN programas p ON i.programa_id = p.id 
            WHERE i.estudiante_email = ?
            ORDER BY i.id DESC`, [req.params.email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ cursos: rows });
    });
});

// Obtener las solicitudes de espacios de un *ESTUDIANTE* específico por email
app.get('/api/estudiante/mis-solicitudes/:email', (req, res) => {
    db.all(`SELECT s.*, e.nombre as escenario_nombre 
            FROM solicitudes_escenarios s
            JOIN escenarios e ON s.escenario_id = e.id
            WHERE s.solicitante_email = ?
            ORDER BY s.id DESC`, [req.params.email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ solicitudes: rows });
    });
});

// ==========================================
// ASISTENCIAS Y CONVOCATORIAS (FASE 3)
// ==========================================

// Registrar asistencia
app.post('/api/asistencias', (req, res) => {
    const { inscripcion_id, estado } = req.body;
    db.run(`INSERT INTO asistencias (inscripcion_id, estado) VALUES (?, ?)`,
        [inscripcion_id, estado || 'Presente'],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, mensaje: 'Asistencia registrada' });
        });
});

// Obtener todas las convocatorias
app.get('/api/convocatorias', (req, res) => {
    db.all('SELECT * FROM convocatorias', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ convocatorias: rows });
    });
});

// Crear una nueva convocatoria
app.post('/api/convocatorias', (req, res) => {
    const { titulo, descripcion, fecha_cierre } = req.body;
    db.run(`INSERT INTO convocatorias (titulo, descripcion, fecha_cierre) VALUES (?, ?, ?)`,
        [titulo, descripcion, fecha_cierre],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, titulo, descripcion, fecha_cierre, estado: 'Activa' });
        });
});

// Eliminar convocatoria
app.delete('/api/convocatorias/:id', (req, res) => {
    db.run(`DELETE FROM convocatorias WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deletedInfo: this.changes });
    });
});

// ==========================================
// ESCENARIOS Y SOLICITUDES (FASE 4)
// ==========================================

// Obtener catálogo de escenarios completos (incluyendo inactivos si lo requiere el admin)
app.get('/api/escenarios', (req, res) => {
    db.all('SELECT * FROM escenarios', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ escenarios: rows });
    });
});

// Crear un nuevo escenario (Admin)
app.post('/api/escenarios', (req, res) => {
    const { nombre, capacidad, ubicacion, precio_base } = req.body;
    db.run(`INSERT INTO escenarios (nombre, capacidad, ubicacion, precio_base, estado) VALUES (?, ?, ?, ?, ?)`,
        [nombre, capacidad, ubicacion || 'Sede Principal', precio_base, 'Activo'],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, mensaje: 'Escenario registrado exitosamente' });
        });
});

// Dar de baja o eliminar escenario
app.delete('/api/escenarios/:id', (req, res) => {
    db.run(`DELETE FROM escenarios WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deletedInfo: this.changes });
    });
});

// Enviar una nueva solicitud de reserva
app.post('/api/solicitudes_escenarios', (req, res) => {
    const { escenario_id, solicitante_nombre, solicitante_email, fecha_solicitada } = req.body;
    db.run(`INSERT INTO solicitudes_escenarios (escenario_id, solicitante_nombre, solicitante_email, fecha_solicitada) 
            VALUES (?, ?, ?, ?)`,
        [escenario_id, solicitante_nombre, solicitante_email, fecha_solicitada],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, mensaje: 'Solicitud enviada correctamente' });
        });
});

// Obtener todas las solicitudes (Admin)
app.get('/api/solicitudes_escenarios', (req, res) => {
    db.all(`SELECT s.*, e.nombre as escenario_nombre FROM solicitudes_escenarios s 
            JOIN escenarios e ON s.escenario_id = e.id
            ORDER BY s.id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ solicitudes: rows });
    });
});

// Actualizar estado de una solicitud (Aprobar/Rechazar)
app.put('/api/solicitudes_escenarios/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.run(`UPDATE solicitudes_escenarios SET estado_solicitud = ? WHERE id = ?`, 
        [estado, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes, mensaje: 'Estado modificado a ' + estado });
    });
});

// ==========================================
// INVENTARIOS Y CONTRATOS (FASE 5)
// ==========================================

// Obtener inventarios
app.get('/api/inventarios', (req, res) => {
    db.all('SELECT * FROM inventarios ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ inventarios: rows });
    });
});

// Crear ítem en inventario
app.post('/api/inventarios', (req, res) => {
    const { articulo, categoria, cantidad, estado } = req.body;
    db.run(`INSERT INTO inventarios (articulo, categoria, cantidad, estado) VALUES (?, ?, ?, ?)`,
        [articulo, categoria, cantidad, estado],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, mensaje: 'Ítem agregado al inventario' });
        });
});

// Eliminar ítem de inventario
app.delete('/api/inventarios/:id', (req, res) => {
    db.run(`DELETE FROM inventarios WHERE id = ?`, req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deletedInfo: this.changes });
    });
});

// Obtener contratos
app.get('/api/contratos', (req, res) => {
    db.all(`SELECT c.*, s.solicitante_nombre, s.fecha_solicitada, e.nombre as escenario_nombre 
            FROM contratos_arrendamiento c
            JOIN solicitudes_escenarios s ON c.solicitud_id = s.id
            JOIN escenarios e ON s.escenario_id = e.id
            ORDER BY c.id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ contratos: rows });
    });
});

// Generar contrato para una solicitud aprobada
app.post('/api/contratos', (req, res) => {
    const { solicitud_id, precio_final } = req.body;
    db.run(`INSERT INTO contratos_arrendamiento (solicitud_id, precio_final) VALUES (?, ?)`,
        [solicitud_id, precio_final],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, mensaje: 'Contrato emitido exitosamente' });
        });
});

// ==========================================
// ESTADÍSTICAS Y RESUMEN (FASE 6)
// ==========================================

app.get('/api/estadisticas', (req, res) => {
    db.serialize(() => {
        let stats = {
            ingresosTotales: 0,
            estudiantesInscritos: 0,
            convocatoriasActivas: 0,
            inventarioDanado: 0,
            solicitudesPendientes: 0
        };

        db.get('SELECT SUM(precio_final) as total FROM contratos_arrendamiento', [], (err, row) => {
            if(row) stats.ingresosTotales = row.total || 0;
        });
        db.get('SELECT COUNT(*) as total FROM inscripciones', [], (err, row) => {
            if(row) stats.estudiantesInscritos = row.total || 0;
        });
        db.get('SELECT COUNT(*) as total FROM convocatorias WHERE estado = "Activa"', [], (err, row) => {
            if(row) stats.convocatoriasActivas = row.total || 0;
        });
        db.get('SELECT COUNT(*) as total FROM inventarios WHERE estado IN ("Regular", "Malo")', [], (err, row) => {
            if(row) stats.inventarioDanado = row.total || 0;
        });
        db.get('SELECT COUNT(*) as total FROM solicitudes_escenarios WHERE estado_solicitud = "Pendiente"', [], (err, row) => {
            if(row) stats.solicitudesPendientes = row.total || 0;
            // Send at the final nested query to ensure all run
            res.json(stats);
        });
    });
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor inicializado en el puerto ${PORT}`);
    console.log(`URL Local: http://localhost:${PORT}`);
});
