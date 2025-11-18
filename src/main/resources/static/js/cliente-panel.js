// Detectar si estamos en local o en producción
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081/api'
    : window.location.origin + '/api';
let token = null;
let usuario = null;

// Verificar autenticación inmediatamente al cargar
(function() {
    console.log('🔍 Cliente Panel - Verificando autenticación...');
    token = localStorage.getItem('token');
    const usuarioStr = localStorage.getItem('usuario');
    
    console.log('Token existe:', !!token);
    console.log('Usuario existe:', !!usuarioStr);
    
    if (!token || !usuarioStr) {
        console.error('❌ No hay sesión activa. Redirigiendo al login...');
        alert('No hay sesión activa. Por favor inicia sesión.');
        window.location.replace('/login.html');
        return;
    }
    
    try {
        usuario = JSON.parse(usuarioStr);
        console.log('✅ Usuario parseado:', usuario.username, 'Rol:', usuario.rol);
        
        if (usuario.rol !== 'CLIENTE') {
            console.error('❌ Rol incorrecto. Esta página es solo para CLIENTES');
            alert('Esta página es solo para CLIENTES');
            window.location.replace('/login.html');
            return;
        }
        
        console.log('✅ Autenticación válida. Inicializando panel...');
    } catch (error) {
        console.error('❌ Error al parsear usuario:', error);
        localStorage.clear();
        window.location.replace('/login.html');
        return;
    }
})();

window.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM cargado, inicializando panel cliente...');
    if (token && usuario) {
        inicializarPanel();
    }
});

function inicializarPanel() {
    console.log('🚀 Inicializando panel para:', usuario.nombreCompleto);
    document.getElementById('nombreUsuario').textContent = usuario.nombreCompleto;
    document.getElementById('nombreCliente').textContent = usuario.nombreCompleto;
    configurarEventListeners();
    cargarBarberos();
    cargarServicios();
    
    // Intentar cargar reservas sin bloquear si falla
    cargarMisReservas().catch(err => {
        console.warn('⚠️ No se pudieron cargar las reservas inicialmente:', err);
        document.getElementById('listaReservas').innerHTML = 
            '<p>No se pudieron cargar tus reservas. Intenta crear una nueva reserva.</p>';
    });
}

function verificarAutenticacion() {
    if (!token || !usuario) {
        console.error('❌ Sesión perdida. Redirigiendo...');
        alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        localStorage.clear();
        window.location.replace('/login.html');
        return false;
    }
    return true;
}

function configurarEventListeners() {
    document.getElementById('btnCerrarSesion').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.clear();
        window.location.replace('/login.html');
    });
    document.getElementById('formNuevaReserva').addEventListener('submit', crearReserva);
    
    // Listeners para cargar horarios disponibles
    document.getElementById('barberoId').addEventListener('change', cargarHorariosDisponibles);
    document.getElementById('servicioId').addEventListener('change', cargarHorariosDisponibles);
    document.getElementById('fecha').addEventListener('change', cargarHorariosDisponibles);
}

async function crearReserva(e) {
    e.preventDefault();
    
    if (!verificarAutenticacion()) return;
    
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('horaInicio').value;
    
    if (!fecha || !hora) {
        alert('❌ Por favor selecciona fecha y hora');
        return;
    }
    
    // Combinar fecha y hora en formato ISO (hora ya incluye segundos HH:mm:ss)
    const fechaHoraInicio = fecha + 'T' + hora;
    
    const data = {
        barberoId: parseInt(document.getElementById('barberoId').value),
        servicioId: parseInt(document.getElementById('servicioId').value),
        fechaHoraInicio: fechaHoraInicio,
        notasCliente: document.getElementById('notas').value
    };
    
    try {
        console.log('📝 Creando reserva...', data);
        const response = await fetch(API_URL + '/reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(data)
        });
        
        console.log('📝 Respuesta crear reserva:', response.status);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ mensaje: 'Error desconocido' }));
            alert('❌ Error al crear la reserva: ' + (error.mensaje || 'Error desconocido'));
            return;
        }
        
        const reserva = await response.json();
        console.log('✅ Reserva creada:', reserva);
        alert('✅ Reserva creada exitosamente');
        document.getElementById('formNuevaReserva').reset();
        document.getElementById('horaInicio').disabled = true;
        document.getElementById('horaInicio').innerHTML = '<option value="">Primero seleccione barbero, servicio y fecha</option>';
        cargarMisReservas().catch(err => console.warn('No se pudieron recargar las reservas'));
    } catch (error) {
        console.error('❌ Error al crear reserva:', error);
        alert('❌ Error de conexión con el servidor');
    }
}

async function cargarBarberos() {
    try {
        console.log('👨‍💼 Cargando barberos...');
        const response = await fetch(API_URL + '/barberos/disponibles');
        
        if (!response.ok) {
            console.error('❌ Error al cargar barberos:', response.status);
            return;
        }
        
        const barberos = await response.json();
        console.log('✅ Barberos cargados:', barberos.length);
        const select = document.getElementById('barberoId');
        select.innerHTML = '<option value="">Seleccione un barbero...</option>';
        barberos.forEach(function(b) {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = b.nombreCompleto;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Error al cargar barberos:', error);
    }
}

async function cargarServicios() {
    try {
        console.log('💇 Cargando servicios...');
        const response = await fetch(API_URL + '/servicios');
        
        if (!response.ok) {
            console.error('❌ Error al cargar servicios:', response.status);
            return;
        }
        
        const servicios = await response.json();
        console.log('✅ Servicios cargados:', servicios.length);
        const select = document.getElementById('servicioId');
        select.innerHTML = '<option value="">Seleccione un servicio...</option>';
        servicios.forEach(function(s) {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = s.nombre + ' - $' + s.precio + ' (' + s.duracionMinutos + ' min)';
            select.appendChild(option);
        });
    } catch (error) {
        console.error('❌ Error al cargar servicios:', error);
    }
}

async function cargarMisReservas() {
    if (!verificarAutenticacion()) return;
    
    try {
        console.log('📋 Cargando reservas con token...');
        const response = await fetch(API_URL + '/reservas/mis-reservas', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        console.log('📋 Respuesta de mis-reservas:', response.status);
        
        if (!response.ok) {
            // Si falla, solo mostrar mensaje sin expulsar al usuario
            console.warn('⚠️ No se pudieron cargar las reservas:', response.status);
            document.getElementById('listaReservas').innerHTML = 
                '<p>⚠️ No hay reservas disponibles o no se pudieron cargar. Puedes crear una nueva reserva usando el formulario de arriba.</p>';
            return;
        }
        
        const reservas = await response.json();
        console.log('✅ Reservas cargadas:', reservas.length);
        const listaDiv = document.getElementById('listaReservas');
        if (reservas.length === 0) {
            listaDiv.innerHTML = '<p>✅ No tienes reservas todavía. Usa el formulario de arriba para crear tu primera reserva.</p>';
            return;
        }
        let html = '<table><thead><tr><th>Barbero</th><th>Servicio</th><th>Fecha/Hora</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
        reservas.forEach(function(r) {
            const fecha = new Date(r.fechaHoraInicio).toLocaleString('es-ES');
            const estadoClass = getEstadoClass(r.estado);
            const estadoBadge = '<span class="badge badge-' + estadoClass + '">' + r.estado + '</span>';
            
            // Determinar acciones disponibles
            const puedeModificar = r.estado === 'CONFIRMADA' || r.estado === 'PENDIENTE';
            let acciones = '-';
            
            if (puedeModificar) {
                acciones = '<div class="action-buttons">' +
                    '<button class="btn-small btn-warning" onclick="abrirModalReprogramar(' + r.id + ', \'' + r.barbero.nombreCompleto + '\', \'' + r.servicio.nombre + '\', \'' + fecha + '\', ' + r.barbero.id + ', ' + r.servicio.id + ')" title="Cambiar fecha/hora">📅 Reprogramar</button>' +
                    '<button class="btn-small btn-danger" onclick="abrirModalCancelar(' + r.id + ')" title="Cancelar reserva">❌ Cancelar</button>' +
                    '</div>';
            } else if (r.estado === 'CANCELADA' && r.motivoCancelacion) {
                acciones = '<small style="color: #666;">Motivo: ' + r.motivoCancelacion + '</small>';
            }
            
            html += '<tr><td>' + r.barbero.nombreCompleto + '</td><td>' + r.servicio.nombre + '</td><td>' + fecha + '</td><td>' + estadoBadge + '</td><td>' + acciones + '</td></tr>';
        });
        html += '</tbody></table>';
        listaDiv.innerHTML = html;
    } catch (error) {
        console.error('❌ Error al cargar reservas:', error);
        document.getElementById('listaReservas').innerHTML = '<p>⚠️ Error al cargar las reservas. Intenta recargar la página.</p>';
    }
}

function getEstadoClass(estado) {
    const estados = {
        'CONFIRMADA': 'success',
        'PENDIENTE': 'warning',
        'CANCELADA': 'danger',
        'COMPLETADA': 'info',
        'NO_ASISTIO': 'secondary'
    };
    return estados[estado] || 'secondary';
}

// Variables globales para modales
let reservaIdActual = null;
let reservaInfoActual = {};

// MODAL CANCELAR
function abrirModalCancelar(reservaId) {
    reservaIdActual = reservaId;
    document.getElementById('motivoCancelacion').value = '';
    document.getElementById('modalCancelar').style.display = 'flex';
}

function cerrarModalCancelar() {
    document.getElementById('modalCancelar').style.display = 'none';
    reservaIdActual = null;
}

async function confirmarCancelacion() {
    if (!reservaIdActual) return;
    
    const motivo = document.getElementById('motivoCancelacion').value.trim() || 'Sin motivo especificado';
    
    try {
        console.log('🗑️ Cancelando reserva #' + reservaIdActual);
        const response = await fetch(API_URL + '/reservas/' + reservaIdActual + '/cancelar', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ motivo: motivo })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ mensaje: 'Error desconocido' }));
            alert('❌ Error al cancelar: ' + (error.mensaje || 'Error desconocido'));
            return;
        }
        
        console.log('✅ Reserva cancelada exitosamente');
        alert('✅ Reserva cancelada exitosamente. Se ha notificado al barbero.');
        cerrarModalCancelar();
        cargarMisReservas();
    } catch (error) {
        console.error('❌ Error al cancelar reserva:', error);
        alert('❌ Error de conexión con el servidor');
    }
}

// MODAL REPROGRAMAR
function abrirModalReprogramar(reservaId, barbero, servicio, fechaActual, barberoId, servicioId) {
    reservaIdActual = reservaId;
    reservaInfoActual = { barberoId, servicioId };
    
    document.getElementById('infoReservaActual').innerHTML = 
        '<strong>Reserva actual:</strong><br>' +
        'Barbero: ' + barbero + '<br>' +
        'Servicio: ' + servicio + '<br>' +
        'Fecha/Hora actual: ' + fechaActual;
    
    document.getElementById('nuevaFecha').value = '';
    document.getElementById('nuevaHora').innerHTML = '<option value="">Primero seleccione una fecha</option>';
    document.getElementById('nuevaHora').disabled = true;
    
    // Event listener para cargar horarios cuando cambie la fecha
    document.getElementById('nuevaFecha').onchange = cargarHorariosReprogramacion;
    
    document.getElementById('modalReprogramar').style.display = 'flex';
}

function cerrarModalReprogramar() {
    document.getElementById('modalReprogramar').style.display = 'none';
    reservaIdActual = null;
    reservaInfoActual = {};
}

async function cargarHorariosReprogramacion() {
    const fecha = document.getElementById('nuevaFecha').value;
    const selectHora = document.getElementById('nuevaHora');
    
    if (!fecha) {
        selectHora.disabled = true;
        selectHora.innerHTML = '<option value="">Primero seleccione una fecha</option>';
        return;
    }
    
    try {
        console.log('🕐 Cargando horarios para reprogramación...');
        const url = `${API_URL}/barberos/${reservaInfoActual.barberoId}/horarios-disponibles?fecha=${fecha}&servicioId=${reservaInfoActual.servicioId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ mensaje: 'Error al cargar horarios' }));
            selectHora.disabled = true;
            selectHora.innerHTML = `<option value="">❌ ${error.mensaje || 'No disponible ese día'}</option>`;
            return;
        }
        
        const data = await response.json();
        const horarios = data.horarios || [];
        
        if (horarios.length === 0) {
            selectHora.disabled = true;
            selectHora.innerHTML = '<option value="">❌ No hay horarios disponibles</option>';
            return;
        }
        
        selectHora.disabled = false;
        selectHora.innerHTML = '<option value="">Seleccione una hora...</option>';
        
        horarios.forEach(function(hora) {
            const option = document.createElement('option');
            option.value = hora;
            const [hours, minutes] = hora.split(':');
            let hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            option.textContent = `${hour}:${minutes} ${ampm}`;
            selectHora.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Error al cargar horarios:', error);
        selectHora.disabled = true;
        selectHora.innerHTML = '<option value="">❌ Error al cargar horarios</option>';
    }
}

async function confirmarReprogramacion() {
    if (!reservaIdActual) return;
    
    const nuevaFecha = document.getElementById('nuevaFecha').value;
    const nuevaHora = document.getElementById('nuevaHora').value;
    
    if (!nuevaFecha || !nuevaHora) {
        alert('❌ Por favor selecciona la nueva fecha y hora');
        return;
    }
    
    const nuevaFechaHora = nuevaFecha + 'T' + nuevaHora;
    
    try {
        console.log('📅 Reprogramando reserva #' + reservaIdActual + ' para ' + nuevaFechaHora);
        const response = await fetch(API_URL + '/reservas/' + reservaIdActual + '/reprogramar', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ nuevaFechaHora: nuevaFechaHora })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ mensaje: 'Error desconocido' }));
            alert('❌ Error al reprogramar: ' + (error.mensaje || 'Error desconocido'));
            return;
        }
        
        console.log('✅ Reserva reprogramada exitosamente');
        alert('✅ Reserva reprogramada exitosamente. Se ha notificado al barbero.');
        cerrarModalReprogramar();
        cargarMisReservas();
    } catch (error) {
        console.error('❌ Error al reprogramar reserva:', error);
        alert('❌ Error de conexión con el servidor');
    }
}

async function cargarHorariosDisponibles() {
    const barberoId = document.getElementById('barberoId').value;
    const servicioId = document.getElementById('servicioId').value;
    const fecha = document.getElementById('fecha').value;
    const selectHora = document.getElementById('horaInicio');
    
    // Si falta algún campo, deshabilitar selector de hora
    if (!barberoId || !servicioId || !fecha) {
        selectHora.disabled = true;
        selectHora.innerHTML = '<option value="">Primero seleccione barbero, servicio y fecha</option>';
        return;
    }
    
    try {
        console.log('🕐 Cargando horarios disponibles...');
        const url = `${API_URL}/barberos/${barberoId}/horarios-disponibles?fecha=${fecha}&servicioId=${servicioId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ mensaje: 'Error al cargar horarios' }));
            selectHora.disabled = true;
            selectHora.innerHTML = `<option value="">❌ ${error.mensaje || 'El barbero no trabaja ese día'}</option>`;
            return;
        }
        
        const data = await response.json();
        const horarios = data.horarios || [];
        
        console.log('✅ Horarios disponibles:', horarios.length);
        
        if (horarios.length === 0) {
            selectHora.disabled = true;
            selectHora.innerHTML = '<option value="">❌ No hay horarios disponibles ese día</option>';
            return;
        }
        
        // Llenar selector con horarios disponibles
        selectHora.disabled = false;
        selectHora.innerHTML = '<option value="">Seleccione una hora...</option>';
        
        horarios.forEach(function(hora) {
            const option = document.createElement('option');
            option.value = hora;
            
            // Formatear hora a 12 horas con AM/PM
            const [hours, minutes] = hora.split(':');
            let hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12; // Convertir 0 a 12, y mantener 1-11
            option.textContent = `${hour}:${minutes} ${ampm}`;
            
            selectHora.appendChild(option);
        });
        
    } catch (error) {
        console.error('❌ Error al cargar horarios:', error);
        selectHora.disabled = true;
        selectHora.innerHTML = '<option value="">❌ Error al cargar horarios</option>';
    }
}
