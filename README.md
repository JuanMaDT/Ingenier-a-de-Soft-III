# Plataforma Integral de Gestión Cultural - Centro Lucy Tejada

Bienvenido al repositorio oficial del sistema central de gestión e interconexión para el **Centro Cultural Lucy Tejada**. Este proyecto (Desarrollado para Ingeniería de Software III) ha sido ensamblado metodológicamente y extendido en ciclos ágiles sobre-cumpliendo el documento base de Visión y Alcance. 

Está dotado de un hermoso frontend estilo **Glassmorphism**, y una arquitectura Full-Stack completamente centralizada que comunica a los civiles estudiantes con la junta directiva en tiempo real.

---

## 🚀 Módulos y Portales del Sistema

Esta plataforma ha evolucionado de ser una simple web administrativa, para convertirse en un Ecosistema de Red con 2 portales aislados basados en roles (`admin` y `estudiante`).

### Portal Estudiantil (Single Page Application para Civiles)
La nueva autonomía del ciudadano. Al llenar su formulario de inscripción desde la web externa, la alcaldía le otorga silenciosamente un usuario con Rol Estudiante (Clave: número telefónico).
* **Catálogo Integrado:** Puede matricularse a nuevos cursos de teatro, danza o arte con 1 solo clic aprovechando la caché.
* **Radicador Oficial:** Puede solicitar el alquiler de escenarios físicos sin salirse del sistema (Alojando un "Radicado Oficial" del estado).
* **Monitor en Vivo:** Vigila sus cursos actuales en modo de cuadrícula elegante y audita si sus Peticiones de escenarios fueron "Aprobadas", "Generado Contrato", o siguen "Pendientes".

### Portal Administrativo (La Oficina Central)
Diseñado para el gerente cultural, dividido en 6 módulos pesados para la total gobernanza del recinto sin necesidad de refrescar molestas pestañas (SPA Mode):
* **Dashboard y Alertas Inteligentes:** Muro de métricas (KPI's) de ingresos netos, y matriz de banners colorizados anti-riesgos. (Avisan de alquileres estancados y micrófonos de bodega dañados).
* **Academia:** Creación de cursos artísticos y visualización de matriculados. (Módulo Asistencias).
* **Inventario y Bodega:** Formato CRUD avanzado del patrimonio físico del edificio y sus componentes electrónicos.
* **Escenarios Físicos (Nuevo 🌟):**
   * Panel 1: Da de alta/baja nuevos Teatros o Salas que la Secretaría de Infraestructura vaya creando en el recinto, con un formulario incrustado determinando el Aforo técnico.
   * Panel 2: Recibe de inmediato las Reservas de Escenarios enviadas por el Portal Estudiantil o las Webs Públicas y las "Aprueba o Rechaza".
* **Burocracia Contractual:** La reserva se hace factura; los admins crean contratos inter-administrativos con número serial de radicado legal para alquiler de infraestructura cobrada.

---

## 💻 Manual de Uso y Ejecución Local (Desarrolladores)

Si eres un maestro evaluador o un equipo de desarrollo externo descargando este código, tu puesta en marcha dura menos de 1 minuto.

### Paso 1: Instalación de las Venas del Sistema
Abre tu consola de comandos en la carpeta raíz (donde ves este README).
Le indicamos a Node.js que prepare e instale nuestras columnas vertebrales locales.
```bash
npm install
```

### Paso 2: Encender Motores
¡No necesitas instalar MySQL gigante o levantar XAMPP! La DB se auto-contruye al nacer.
```bash
node server.js
```

### Paso 3: Interactuar Web
Toma estas llaves públicas e insértalas en tu Chrome / Safari / Edge:
1. **Vista de Cliente (Para llenar info como ciudadano):** `http://localhost:3000/inscripcion.html` ó `http://localhost:3000/escenarios.html`
2. **Vista Institucional Privada (El Login maestro de la Red):** `http://localhost:3000/index.html` 

> 🔐 **Credenciales Maestras del Administrador:**
> **Usuario:** `admin@cultura.gov`
> **Contraseña:** `admin123`

---
*Si deseas más contexto sobre el motor técnico asíncrono y los protocolos JS puros utilizados en este código, lee el archivo oficial adjunto: `DOCUMENTACION_TECNICA.md`*
