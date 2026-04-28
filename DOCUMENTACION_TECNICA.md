# Documentación Técnica y Arquitectónica
**Proyecto:** Plataforma Integral de Gestión Cultural
**Ámbito:** Académico e Institucional (Ingeniería de Software III)

---

## 1. Stack Tecnológico Elegido
El desarrollo optó por un enfoque nativo sin frameworks pesados en el lado del cliente, garantizando ligereza extrema, cero dependencias pesadas en el navegador, y una pedagogía fuerte en tecnologías web Fundamentales (DOM Manipulation).
- **Backend:** `Node.js` v18+ 
- **Motor de Ruteo & Servidor:** `Express.js` (Eje principal de endpoints RESTful).
- **Base de Datos:** `SQLite3` (Operada con el driver asincrónico por defecto, escogida por su inyección cero-configuración sin requerir montajes complejos local/servidor).
- **Seguridad:** `bcryptjs` (Usada para enmascaramiento con SALT de las contraseñas telefónicas de los ciudadanos antes de inyectarlas en DB).
- **Frontend Core:** `Vanilla JavaScript` (ES6+ Asíncrono puro con `Fetch API`), `HTML5`, `CSS3 Nativo` con arquitectura Glassmorphism de renderizado por variables de Sistema (Custom Properties HDR).

---

## 2. Diagrama de Arquitectura del Sistema
La plataforma corre mediante una estructura Full-Stack de **Cliente Ligero -> API RESTful Central -> Base de Relacional.**
Todo se divide en dos grandes vistas corporativas que consumen el mismo servicio de backend (`server.js`):

1. **La Puerta Ciudadana (Portales Públicos y `estudiante.html`):** Los civiles consumen de aquí la matriz de información, listados de cursos disponibles e inyectan POST de reservación que quedan bajo estado `Pendiente`.
2. **La Central de Control (`dashboard.html`):** La SPA corporativa. Extrae información asíncrona de los estados administrativos que llegan del portal ciudadano y tiene privilegios CRUD sobre todos los módulos.

Ambos están protegidos por Autorización de Rol y LocalStorage (`localStorage.getItem('user')`).

---

## 3. Módulos y Topología de Bases de Datos

### Tabla: `usuarios` (Bóveda de Credenciales)
- **Campos:** `id`, `nombre`, `email` [UNIQUE], `password` [Hashed], `rol` ('admin' o 'estudiante').
- **Responsabilidad:** Filtrar en la puerta principal de sesión (index) quién está intentando acceder. Su controlador principal es `POST /api/auth/login` que compara Hash bcrypt y devuelve el objeto JSON al front.

### Tabla: `programas` e `inscripciones` (Control Académico)
- **Lógica:** Relación Una a Muchas. Un programa contiene muchas inscripciones. 
- **Endpoints Clave:**
  - `GET /api/estudiante/mis-cursos/:email`: Motor del Portal Ciudadano. Efectúa un SQL `JOIN` cruzando el ID del programa para llevarle al Front en vivo el nombre y nivel del curso a las tarjetas de "Cursando".
  - `POST /api/inscripciones`: Función Híbrida. Cuando entra el POST público de `inscripcion.html`, el micro-controlador detecta si el usuario no existe, **crea dinámicamente un hash bcrypt con el Celular** y lo mete en la Tabla Usuarios antes de darle su cupo a la clase en la Tabla Inscripciones. Cero fricción en UX.

### Tabla: `escenarios` y `solicitudes_escenarios` (Gestión de Infraestructuras)
- **Lógica:** El Admin dicta cuántas y con qué capacidad existen infraestructuras. Los ciudadanos asocian un registro histórico a éstas.
- **Flujo Bi-Direccional:**
   1. Admin usa `POST /api/escenarios` para dar de alta. Automáticamente la vista SPA (`fetchEscAdmin()`) actualiza su Cuadrante Superior.
   2. El Estudiante entra a su SPA, oprime "+ Nuevo Radicado". Hace un GET para el listado e incrusta el suyo como POST.
   3. En el Admin, el Cuadrante Inferior lo pinta la función `fetchSolicitudes()` mostrando los botones ROJO/VERDE para Rechazar o Aprobar invocando la actualización de Bases de Datos `PUT /api/solicitudes_escenarios/:id/estado`.

### Tablas Industriales: `inventarios` y `contratos_arrendamiento` (Burocracia Pesada)
- Se desligó de los módulos convencionales creando contenedores DOM cerrados en `dashboard.html`.
- `inventarios` es un CRUD plano con `estado` fluctuante (Funcional, Dañado).
- `contratos_arrendamiento` lee directamente la petición de escenarios enviada por el ciudadano y la sella bajo un `monto` numérico final, disparando el estado de la reserva hacia `"Contrato Generado"`.

---

## 4. Patrones de Diseño Implementados en Frontend

### SPA Emulada (DOM Hijacking)
Para no obligar la descarga de Vue o React, se diseñó la función maestro `switchTab()` y `switchTabEstudiante()`.
El controlador itera un *Array* de nombres predefinidos (`['cursos', 'catalogo', 'reservas']`), localiza los contenedores `div` por su ID y apaga sus CSS Attributes (`display: none`), encendiendo únicamente el clicado (`display: block`).
Posterior a eso, ejecuta inmediatamente el método Fetch delegado a ese contexto particular para obligar a que el usuario siempre vea datos re-cargados a milésimas de segundo (Ej: Al entrar a la pestaña, se llama obligatoriamente a `fetchMisReservas()`).

### Alertas Dinámicas por Inteligencia Empírica
La función en Frontend `verifiAlert()` hace un recuento de JSON Object lengths (¿Qué tan largas son las listas de datos?).
Si la variable detecta que un array de "Solicitudes Pendientes" vino de MySQL con longitud mayor a 0, genera un Inyectable de HTML en modo Banner Naranja en la primera capa del DOM y presiona sobre la vista del Administrador instandolo a trabajar en ese frente desatendido.

### Estilo Glassmorphism Pura Sangre
Definiendo variables globales en el root de `:root` CSS, se le dio una transparencia `rgba` estelar al fondo junto a un filtro algorítmico `backdrop-filter: blur(12px)`. Esto recubre todos los contenedores `.glass-container` con un aspecto vitrificado que refleja el backend en un entorno inmersivo.

---

### Conclusión Técnica
Esta infraestructura representa un servidor REST completo capaz de manejar un CRUD transversal asíncrono y de responder a dos aplicaciones cliente separadas que comparten recursos e I/O sin necesidad de recargar la página HTTP principal. Mantenible, portable y escalable.
