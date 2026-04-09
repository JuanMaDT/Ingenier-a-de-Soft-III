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
                window.location.href = 'dashboard.html';
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
    document.getElementById('navProgramas').classList.remove('active');
    document.getElementById('navConvocatorias').classList.remove('active');
    document.getElementById('navEscenarios').classList.remove('active');
    
    document.getElementById('programasView').style.display = 'none';
    document.getElementById('convocatoriasView').style.display = 'none';
    document.getElementById('escenariosView').style.display = 'none';

    if(tab === 'programas') {
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
// SOLICITUDES DE ESCENARIOS (FASE 4)
// ==========================================

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
            } else {
                actionsHtml = `<span style="color:var(--text-muted); font-size:0.9rem;">Cerrada</span>`;
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
