# Plataforma Integral de Gestión Cultural - Centro Cultural Lucy Tejada

Este es el repositorio oficial del sistema web del Centro Cultural, desarrollado durante el curso de Software III. Está construido para ser ligero, minimalista (empleando Vanilla JS y HTML/CSS) y apoyarse sobre un backend estructurado en Node.js, Express y SQLite.

## Requisitos Previos

Para ejecutar la plataforma en formato local, debes tener instalado:
- **Node.js** (Versión 18+ o superior es recomendada).

*No es necesario instalar motores de base de datos como MySQL o Postgres*, ya que el proyecto utiliza **SQLite** (una base de datos embebida ligera), la cual se construye y configura automáticamente en tu dispositivo la primera vez que inicia el servidor.

## Pasos para la Ejecución Local

Sigue estas instrucciones al pie de la letra desde tu terminal (o la consola integrada de tu editor de texto preferido como VS Code):

### 1. Clonar el repositorio
Si aún no tienes el código localmente, descárgalo:
```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DE_LA_CARPETA>
```

### 2. Instalar Módulos
Debido a que los archivos pesados de `node_modules` no se suben a Git, debes descargar las dependencias definidas en el `package.json` original del proyecto:
```bash
npm install
```
*(Esto instalará Express, bcryptjs, cors y sqlite3).*

### 3. Iniciar el Servidor
Una vez instalados los paquetes, ejecuta:
```bash
node server.js
```
Verás un mensaje en la consola indicando que el servidor se ha inicializado y que tu base de datos (`cultura.db`) fue recreada. Se generará automáticamente un volumen en el entorno local.

### 4. Navegar por la Aplicación

Abre tu navegador de confianza (Chrome, Edge, Firefox) y usa las siguientes URL:

- **Inicio de sesión Administrador:** `http://localhost:3000/index.html`
- **Inscripciones Públicas:** `http://localhost:3000/inscripcion.html`
- **Reserva Pública de Escenarios:** `http://localhost:3000/escenarios.html`

> **Credenciales de prueba generadas por defecto:**
> **Usuario:** `admin@cultura.gov`
> **Contraseña:** `admin123`
