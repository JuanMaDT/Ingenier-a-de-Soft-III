// Utilidad: Mostrar Alertas
function showAlert(message, type = 'error') {
    const box = document.getElementById('alertBox');
    if (!box) return;
    box.className = `alert alert-${type}`;
    box.textContent = message;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 5000);
}

// Utilidad: Control de Modales
function toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
    }
}

// ==========================================
// LÓGICA DE LOGIN (index.html)
// ==========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                if (data.user.rol === 'admin') {
                    window.location.href = 'dashboard.html';
                } else if (data.user.rol === 'estudiante') {
                    window.location.href = 'estudiante.html';
                } else {
                    window.location.href = 'index.html'; // Default fallback
                }
            } else {
                showAlert(data.error || 'Credenciales inválidas');
            }
        } catch (err) {
            showAlert('Error de conexión con el servidor');
        }
    });
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ==========================================
// LÓGICA DEL DASHBOARD DE PROGRAMAS (dashboard.html)
// ==========================================

async function fetchProgramas() {
    try {
        const res = await fetch('/api/programas');
        const data = await res.json();
        
        const tbody = document.getElementById('programTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        data.programas.forEach(prog => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${prog.nombre}</strong></td>
                <td><span class="badge" style="background: rgba(99,102,241,0.2); color: var(--primary)">${prog.area}</span></td>
                <td>${prog.niveles}</td>
                <td>${prog.cupos}</td>
                <td><span class="badge badge-active">${prog.estado}</span></td>
                <td>
                    <button class="btn" onclick="verInscritos(${prog.id}, '${prog.nombre.replace(/'/g, "\\'")}')" style="padding: 0.25rem 0.75rem; font-size: 0.8rem; background: rgba(99,102,241,0.2); color: var(--primary); border: 1px solid rgba(99,102,241,0.3); margin-right: 0.5rem;">Ver Inscritos</button>
                    <button class="btn btn-danger" onclick="eliminarPrograma(${prog.id})" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error cargando programas:', err);
        showAlert('Error al cargar la lista de programas');
    }
}

const programForm = document.getElementById('programForm');
if (programForm) {
    programForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nombre: document.getElementById('progNombre').value,
            area: document.getElementById('progArea').value,
            niveles: parseInt(document.getElementById('progNiveles').value),
            cupos: parseInt(document.getElementById('progCupos').value)
        };

        try {
            const res = await fetch('/api/programas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toggleModal('programModal');
                programForm.reset();
                fetchProgramas();
            } else {
                const data = await res.json();
                showAlert(data.error);
            }
        } catch (err) {
            showAlert('Error al guardar el programa');
        }
    });
}

async function eliminarPrograma(id) {
    if(!confirm('¿Estás seguro de eliminar este programa?')) return;
    try {
        await fetch(`/api/programas/${id}`, { method: 'DELETE' });
        fetchProgramas();
    } catch(err) {
        showAlert('Error al eliminar');
    }
}

async function verInscritos(programaId, programaNombre) {
    try {
        const res = await fetch(`/api/programas/${programaId}/inscripciones`);
        const data = await res.json();
        
        document.getElementById('estudiantesModalTitle').textContent = `Inscritos: ${programaNombre} (${data.inscripciones.length})`;
        const tbody = document.getElementById('estudiantesTableBody');
        tbody.innerHTML = '';
        
        if (data.inscripciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted)">No hay estudiantes inscritos aún.</td></tr>';
        } else {
            data.inscripciones.forEach(est => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${est.estudiante_nombre}</td>
                    <td>${est.estudiante_email}</td>
                    <td>${est.estudiante_telefono}</td>
                    <td>
                        <button class="badge" onclick="marcarAsistencia(${est.id})" style="cursor:pointer; border:1px solid var(--border-color); background:rgba(255,255,255,0.05); color:white;">☑ Asistió</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        // Show modal
        document.getElementById('estudiantesModal').style.display = 'block';
    } catch(err) {
        showAlert('Error al cargar la lista de inscritos');
    }
}

// ==========================================
// LÓGICA DE INSCRIPCIONES (inscripcion.html)
// ==========================================

async function loadProgramasForSelect() {
    const select = document.getElementById('insPrograma');
    if (!select) return;

    try {
        const res = await fetch('/api/programas');
        const data = await res.json();
        
        select.innerHTML = '<option value="">Selecciona un programa...</option>';
        data.programas.forEach(prog => {
            const option = document.createElement('option');
            option.value = prog.id;
            option.textContent = `${prog.nombre} (${prog.area})`;
            select.appendChild(option);
        });
    } catch (err) {
        select.innerHTML = '<option value="">Error al cargar programas</option>';
    }
}

const insForm = document.getElementById('inscripcionForm');
if (insForm) {
    insForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            estudiante_nombre: document.getElementById('insNombre').value,
            estudiante_email: document.getElementById('insEmail').value,
            estudiante_telefono: document.getElementById('insTelefono').value,
            programa_id: document.getElementById('insPrograma').value
        };

        try {
            const res = await fetch('/api/inscripciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                document.getElementById('formContainer').style.display = 'none';
                document.getElementById('successContainer').style.display = 'block';
                document.getElementById('radicadoNum').textContent = "RAD-" + new Date().getFullYear() + "-" + data.transcacion_id.toString().padStart(4, '0');
            } else {
                showAlert(data.error);
            }
        } catch (err) {
            showAlert('Error al procesar inscripción');
        }
    });
}

// ==========================================
// TABS Y CONVOCATORIAS (FASE 3)
// ==========================================

function switchTab(tab) {
    ['Resumen', 'Programas', 'Convocatorias', 'Escenarios', 'Inventario', 'Contratos'].forEach(t => {
        const el = document.getElementById(`nav${t}`);
        if(el) el.classList.remove('active');
        const view = document.getElementById(`${t.toLowerCase()}View`);
        if(view) view.style.display = 'none';
    });

    if(tab === 'resumen') {
        document.getElementById('navResumen').classList.add('active');
        document.getElementById('resumenView').style.display = 'block';
        if(typeof fetchEstadisticas === 'function') fetchEstadisticas();
    } else if(tab === 'programas') {
        document.getElementById('navProgramas').classList.add('active');
        document.getElementById('programasView').style.display = 'block';
    } else if (tab === 'convocatorias') {
        document.getElementById('navConvocatorias').classList.add('active');
        document.getElementById('convocatoriasView').style.display = 'block';
        if(typeof fetchConvocatorias === 'function') fetchConvocatorias();
    } else if (tab === 'escenarios') {
        document.getElementById('navEscenarios').classList.add('active');
        document.getElementById('escenariosView').style.display = 'block';
        if(typeof fetchSolicitudes === 'function') fetchSolicitudes();
        if(typeof fetchEscAdmin === 'function') fetchEscAdmin(); // FASE EXTRA PARTE 4
    } else if (tab === 'inventario') {
        document.getElementById('navInventario').classList.add('active');
        document.getElementById('inventarioView').style.display = 'block';
        if(typeof fetchInventario === 'function') fetchInventario();
    } else if (tab === 'contratos') {
        document.getElementById('navContratos').classList.add('active');
        document.getElementById('contratosView').style.display = 'block';
        if(typeof fetchContratos === 'function') fetchContratos();
    }
}

async function marcarAsistencia(inscripcion_id) {
    try {
        const res = await fetch('/api/asistencias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inscripcion_id, estado: 'Presente' })
        });
        if (res.ok) {
            showAlert('Asistencia registrada correctamente', 'success');
        } else {
            showAlert('Error al registrar asistencia');
        }
    } catch(err) {
        showAlert('Error de conexión');
    }
}

async function fetchConvocatorias() {
    try {
        const res = await fetch('/api/convocatorias');
        const data = await res.json();
        
        const tbody = document.getElementById('convocatoriaTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        data.convocatorias.forEach(conv => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${conv.titulo}</strong></td>
                <td>${conv.descripcion}</td>
                <td>${conv.fecha_cierre}</td>
                <td><span class="badge badge-active">${conv.estado}</span></td>
                <td>
                    <button class="btn btn-danger" onclick="eliminarConvocatoria(${conv.id})" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error cargando convocatorias:', err);
    }
}

const convocForm = document.getElementById('convocatoriaForm');
if (convocForm) {
    convocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            titulo: document.getElementById('convTitulo').value,
            descripcion: document.getElementById('convDesc').value,
            fecha_cierre: document.getElementById('convCierre').value
        };

        try {
            const res = await fetch('/api/convocatorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toggleModal('convocatoriaModal');
                convocForm.reset();
                fetchConvocatorias();
            } else {
                showAlert('Error al crear convocatoria');
            }
        } catch (err) {
            showAlert('Error al guardar');
        }
    });
}

async function eliminarConvocatoria(id) {
    if(!confirm('¿Estás seguro de eliminar esta convocatoria?')) return;
    try {
        await fetch(`/api/convocatorias/${id}`, { method: 'DELETE' });
        fetchConvocatorias();
    } catch(err) {
        showAlert('Error al eliminar');
    }
}

// ==========================================
// SOLICITUDES Y CRUD DE ESCENARIOS (FASE 4)
// ==========================================

async function fetchEscAdmin() {
    try {
        const res = await fetch('/api/escenarios');
        const data = await res.json();
        const tbody = document.getElementById('escAdminTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (data.escenarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">Catálogo vacío.</td></tr>';
            return;
        }

        data.escenarios.forEach(esc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${esc.nombre}</strong></td>
                <td>${esc.capacidad} expect.</td>
                <td><span class="badge" style="background:rgba(255,255,255,0.1)">${esc.ubicacion}</span></td>
                <td>$${parseFloat(esc.precio_base).toLocaleString()} COP</td>
                <td>
                    <button class="btn btn-sm" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;" onclick="eliminarEscenario(${esc.id})">Desactivar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        console.error(err);
    }
}

async function eliminarEscenario(id) {
    if(!confirm('¿Eliminar este escenario del catálogo operativo?')) return;
    try {
        await fetch(`/api/escenarios/${id}`, { method: 'DELETE' });
        fetchEscAdmin(); // Recargar cuadrícula Admin
    } catch(e) {
        showAlert('Error tratando de eliminar.');
    }
}

const escAdminForm = document.getElementById('escenarioAdminForm');
if(escAdminForm) {
    escAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nombre: document.getElementById('escAdmNombre').value,
            capacidad: document.getElementById('escAdmCapacidad').value,
            precio_base: document.getElementById('escAdmPrecio').value,
            ubicacion: document.getElementById('escAdmUbicacion').value
        };

        try {
            const res = await fetch('/api/escenarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toggleModal('escenarioAdminModal');
                escAdminForm.reset();
                fetchEscAdmin();
            } else {
                showAlert('Error anexando infraestructura.');
            }
        } catch (err) {
            showAlert('Falló la solicitud.');
        }
    });
}

async function fetchSolicitudes() {
    try {
        const res = await fetch('/api/solicitudes_escenarios');
        const data = await res.json();
        const tbody = document.getElementById('solicitudesTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (data.solicitudes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-muted)">No hay solicitudes pendientes.</td></tr>';
            return;
        }

        data.solicitudes.forEach(sol => {
            const tr = document.createElement('tr');
            const bgBadge = sol.estado_solicitud === 'Pendiente' ? 'rgba(234, 179, 8, 0.2)' : 
                            (sol.estado_solicitud === 'Aprobada' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)');
            const cBadge = sol.estado_solicitud === 'Pendiente' ? '#eab308' : 
                           (sol.estado_solicitud === 'Aprobada' ? '#22c55e' : '#ef4444');

            let actionsHtml = '';
            if (sol.estado_solicitud === 'Pendiente') {
                actionsHtml = `
                    <button class="btn" style="background:#22c55e; color:white; padding:0.25rem 0.6rem; font-size:0.8rem; border:none; margin-right:5px; cursor:pointer;" onclick="actualizarSolicitud(${sol.id}, 'Aprobada')">Aprobar</button>
                    <button class="btn btn-danger" style="padding:0.25rem 0.6rem; font-size:0.8rem;" onclick="actualizarSolicitud(${sol.id}, 'Rechazada')">Rechazar</button>
                `;
            } else if (sol.estado_solicitud === 'Aprobada') {
                actionsHtml = `<button class="btn btn-primary" style="padding:0.25rem 0.6rem; font-size:0.8rem;" onclick="generarContrato(${sol.id})">Generar Contrato</button>`;
            } else {
                actionsHtml = `<span style="color:var(--text-muted); font-size:0.9rem;">Cerrada/Archivada</span>`;
            }

            tr.innerHTML = `
                <td><strong>RES-2026-${sol.id.toString().padStart(4, '0')}</strong></td>
                <td>${sol.escenario_nombre}</td>
                <td>${sol.solicitante_nombre}</td>
                <td>${sol.solicitante_email}</td>
                <td>${sol.fecha_solicitada}</td>
                <td><span class="badge" style="background:${bgBadge}; color:${cBadge}; font-weight:600;">${sol.estado_solicitud}</span></td>
                <td>${actionsHtml}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error cargando solicitudes:', err);
    }
}

async function actualizarSolicitud(id, estado) {
    if (!confirm(`¿Estás seguro de marcar esta solicitud como ${estado}?`)) return;
    try {
        const res = await fetch(`/api/solicitudes_escenarios/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });
        if (res.ok) {
            showAlert(`Reserva ${estado} exitosamente`, 'success');
            fetchSolicitudes();
        } else {
            showAlert('Error al actualizar');
        }
    } catch (err) {
        showAlert('Error de red');
    }
}
// ==========================================
// INVENTARIOS Y CONTRATOS (FASE 5)
// ==========================================

async function generarContrato(solicitud_id) {
    const precio = prompt('Generación de Contrato\nEscribe el precio final acordado para el arrendamiento de este escenario:');
    if(precio === null) return;
    
    if(isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
        return showAlert('Por favor ingresa un precio numérico válido.');
    }

    try {
        const res = await fetch('/api/contratos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solicitud_id, precio_final: parseFloat(precio) })
        });
        if(res.ok) {
            showAlert('Contrato formalizado correctamente', 'success');
            actualizarSolicitud(solicitud_id, 'Contrato Generado'); // Hide generate button
            if(typeof fetchContratos === 'function') fetchContratos();
        } else {
            showAlert('Error al generar el contrato');
        }
    } catch (err) {
        showAlert('Error de red');
    }
}

async function fetchContratos() {
    try {
        const res = await fetch('/api/contratos');
        const data = await res.json();
        const tbody = document.getElementById('contratosTableBody');
        if(!tbody) return;

        tbody.innerHTML = '';
        data.contratos.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>CON-26-${c.id}</strong></td>
                <td>${c.escenario_nombre}</td>
                <td>${c.solicitante_nombre}</td>
                <td><span style="color:var(--primary); font-weight:bold;">$${c.precio_final.toLocaleString()}</span></td>
                <td>${new Date(c.fecha_solicitada).toLocaleDateString()}</td>
                <td>${c.fecha_generacion}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        console.error(err);
    }
}

async function fetchInventario() {
    try {
        const res = await fetch('/api/inventarios');
        const data = await res.json();
        const tbody = document.getElementById('inventarioTableBody');
        if(!tbody) return;

        tbody.innerHTML = '';
        data.inventarios.forEach(inv => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${inv.articulo}</strong></td>
                <td><span class="badge" style="background:rgba(255,255,255,0.1)">${inv.categoria}</span></td>
                <td>${inv.cantidad} Unidades</td>
                <td>${inv.estado}</td>
                <td>
                    <button class="btn btn-danger" onclick="eliminarInventario(${inv.id})" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Descartar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
    }
}

const invForm = document.getElementById('inventarioForm');
if(invForm) {
    invForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            articulo: document.getElementById('invArticulo').value,
            categoria: document.getElementById('invCategoria').value,
            cantidad: document.getElementById('invCantidad').value,
            estado: document.getElementById('invEstado').value
        };
        try {
            const res = await fetch('/api/inventarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if(res.ok) {
                toggleModal('inventarioModal');
                invForm.reset();
                fetchInventario();
                showAlert('Artículo agregado al inventario', 'success');
            }
        } catch(err) {}
    });
}

async function eliminarInventario(id) {
    if(!confirm('¿Estás seguro de descartar/dar de baja este artículo?')) return;
    try {
        await fetch(`/api/inventarios/${id}`, { method: 'DELETE' });
        fetchInventario();
    } catch(err) {}
}

// ==========================================
// ESTADÍSTICAS (FASE 6)
// ==========================================

async function fetchEstadisticas() {
    try {
        const res = await fetch('/api/estadisticas');
        const stat = await res.json();
        
        // Asignar los KPIs numéricos 
        document.getElementById('kpiIngresos').textContent = `$${stat.ingresosTotales.toLocaleString()}`;
        document.getElementById('kpiEstudiantes').textContent = stat.estudiantesInscritos;
        document.getElementById('kpiConvocatorias').textContent = stat.convocatoriasActivas;
        
        let contratosCount = 0;
        const tbody = document.getElementById('contratosTableBody');
        if(tbody) contratosCount = tbody.children.length;
        document.getElementById('kpiInventario').textContent = contratosCount || '...';
        
        // Alertas Dinámicas (Si hay requerimientos en rojo)
        const alertasBox = document.getElementById('systemAlerts');
        if(!alertasBox) return;
        
        let alertasMarkup = '';
        if(stat.solicitudesPendientes > 0) {
            alertasMarkup += `<div class="glass-container" style="background: rgba(239, 68, 68, 0.2); border-left: 4px solid #ef4444; padding: 1rem; margin-bottom: 10px;">
                                <strong style="color: #fca5a5;">¡Atención Administrador!</strong> Tienes <b>${stat.solicitudesPendientes}</b> solicitud(es) de escenario pendientes por Aprobar o Rechazar.
                              </div>`;
        }
        if(stat.inventarioDanado > 0) {
            alertasMarkup += `<div class="glass-container" style="background: rgba(245, 158, 11, 0.2); border-left: 4px solid #f59e0b; padding: 1rem;">
                                <strong style="color: #fcd34d;">¡Aviso de Mantenimiento!</strong> Tienes <b>${stat.inventarioDanado}</b> ítem(s) de inventario marcados en estado Regular o Malo.
                              </div>`;
        }
        
        if(alertasMarkup === '') {
            alertasBox.innerHTML = `<span style="color: #10b981;">✓ Sistema operando óptimamente. Sin notificaciones pendientes.</span>`;
        } else {
            alertasBox.innerHTML = alertasMarkup;
        }

    } catch(err) {
        console.error('Error fetching estadisticas');
    }
}
