// Detectar si estamos en local o en producción
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081/api'
    : window.location.origin + '/api';
let token = null;
let usuario = null;

// Verificar autenticación inmediatamente al cargar
(function() {
    console.log('🔍 Barbero Panel - Verificando autenticación...');
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
        
        if (usuario.rol !== 'BARBERO') {
            console.error('❌ Rol incorrecto. Esta página es solo para BARBEROS');
            alert('Esta página es solo para BARBEROS');
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
    console.log('📄 DOM cargado, inicializando panel barbero...');
    if (token && usuario) {
        inicializarPanel();
    }
});

function inicializarPanel() {
    console.log('🚀 Inicializando panel para:', usuario.nombreCompleto);
    document.getElementById('nombreUsuario').textContent = usuario.nombreCompleto;
    document.getElementById('nombreBarbero').textContent = usuario.nombreCompleto;
    configurarEventListeners();
    
    // Intentar cargar datos sin bloquear si falla
    cargarMisHorarios().catch(err => {
        console.warn('⚠️ No se pudieron cargar los horarios inicialmente:', err);
        document.getElementById('listaHorarios').innerHTML = 
            '<p>No se pudieron cargar tus horarios. Puedes agregar uno nuevo usando el formulario de arriba.</p>';
    });
    
    cargarMisReservas().catch(err => {
        console.warn('⚠️ No se pudieron cargar las reservas inicialmente:', err);
        document.getElementById('listaReservas').innerHTML = 
            '<p>No se pudieron cargar las reservas.</p>';
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
    document.getElementById('formNuevoHorario').addEventListener('submit', crearHorario);
}

async function crearHorario(e) {
    e.preventDefault();
    
    if (!verificarAutenticacion()) return;
    
    const data = {
        diaSemana: document.getElementById('diaSemana').value,
        horaInicio: document.getElementById('horaInicio').value,
        horaFin: document.getElementById('horaFin').value
    };
    
    try {
        console.log('📝 Creando horario...', data);
        const response = await fetch(API_URL + '/horarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(data)
        });
        
        console.log('📝 Respuesta crear horario:', response.status);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ mensaje: 'Error desconocido' }));
            alert('❌ Error al agregar horario: ' + (error.mensaje || 'Error desconocido'));
            return;
        }
        
        const horario = await response.json();
        console.log('✅ Horario creado:', horario);
        alert('✅ Horario agregado exitosamente');
        document.getElementById('formNuevoHorario').reset();
        cargarMisHorarios().catch(err => console.warn('No se pudieron recargar los horarios'));
    } catch (error) {
        console.error('❌ Error al crear horario:', error);
        alert('❌ Error de conexión con el servidor');
    }
}

async function cargarMisHorarios() {
    if (!verificarAutenticacion()) return;
    
    try {
        console.log('📅 Cargando horarios...');
        const response = await fetch(API_URL + '/horarios/mis-horarios', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        console.log('📅 Respuesta de mis-horarios:', response.status);
        
        if (!response.ok) {
            // Si falla, solo mostrar mensaje sin expulsar al usuario
            console.warn('⚠️ No se pudieron cargar los horarios:', response.status);
            document.getElementById('listaHorarios').innerHTML = 
                '<p>⚠️ No hay horarios disponibles. Puedes agregar uno nuevo usando el formulario de arriba.</p>';
            return;
        }
        
        const horarios = await response.json();
        console.log('✅ Horarios cargados:', horarios.length);
        const listaDiv = document.getElementById('listaHorarios');
        if (horarios.length === 0) {
            listaDiv.innerHTML = '<p>No tienes horarios configurados.</p>';
            return;
        }
        let html = '<table><thead><tr><th>Dia</th><th>Hora Inicio</th><th>Hora Fin</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
        horarios.forEach(function(h) {
            html += '<tr><td>' + traducirDia(h.diaSemana) + '</td><td>' + h.horaInicio + '</td><td>' + h.horaFin + '</td><td>' + (h.activo ? 'Activo' : 'Inactivo') + '</td><td>' + (h.activo ? '<button class="btn-small btn-danger" onclick="eliminarHorario(' + h.id + ')">Eliminar</button>' : '-') + '</td></tr>';
        });
        html += '</tbody></table>';
        listaDiv.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        document.getElementById('listaHorarios').innerHTML = '<p>Error al cargar horarios</p>';
    }
}

async function eliminarHorario(horarioId) {
    if (!confirm('Eliminar este horario?')) return;
    try {
        const response = await fetch(API_URL + '/horarios/' + horarioId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (response.ok) {
            alert('Horario eliminado');
            cargarMisHorarios();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        alert('Error de conexion');
    }
}

async function cargarMisReservas() {
    if (!verificarAutenticacion()) return;
    
    try {
        console.log('📋 Cargando reservas...');
        const response = await fetch(API_URL + '/reservas/mis-reservas', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        console.log('📋 Respuesta de mis-reservas:', response.status);
        
        if (!response.ok) {
            // Si falla, solo mostrar mensaje sin expulsar al usuario
            console.warn('⚠️ No se pudieron cargar las reservas:', response.status);
            document.getElementById('listaReservas').innerHTML = 
                '<p>⚠️ No hay reservas programadas.</p>';
            return;
        }
        
        const reservas = await response.json();
        console.log('✅ Reservas cargadas:', reservas.length);
        const listaDiv = document.getElementById('listaReservas');
        if (reservas.length === 0) {
            listaDiv.innerHTML = '<p>No hay reservas programadas.</p>';
            return;
        }
        let html = '<table><thead><tr><th>Cliente</th><th>Servicio</th><th>Fecha/Hora</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
        reservas.forEach(function(r) {
            const fecha = new Date(r.fechaHoraInicio).toLocaleString('es-ES');
            const puedeCompletar = r.estado === 'CONFIRMADA';
            html += '<tr><td>' + r.cliente.nombreCompleto + '</td><td>' + r.servicio.nombre + '</td><td>' + fecha + '</td><td>' + r.estado + '</td><td>' + (puedeCompletar ? '<button class="btn-small" onclick="completarReserva(' + r.id + ')">Completar</button>' : '-') + '</td></tr>';
        });
        html += '</tbody></table>';
        listaDiv.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        document.getElementById('listaReservas').innerHTML = '<div class="alert alert-error">Error al cargar las reservas</div>';
    }
}

function traducirDia(dia) {
    const dias = { 'MONDAY': 'Lunes', 'TUESDAY': 'Martes', 'WEDNESDAY': 'Miercoles', 'THURSDAY': 'Jueves', 'FRIDAY': 'Viernes', 'SATURDAY': 'Sabado', 'SUNDAY': 'Domingo' };
    return dias[dia] || dia;
}

async function completarReserva(reservaId) {
    if (!verificarAutenticacion()) return;
    
    if (!confirm('¿Marcar esta reserva como completada?')) return;
    
    try {
        const response = await fetch(API_URL + '/reservas/' + reservaId + '/completar', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + token 
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error('❌ Token inválido al completar reserva');
                alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                localStorage.clear();
                window.location.replace('/login.html');
                return;
            }
            const error = await response.json();
            alert('Error al completar reserva: ' + (error.mensaje || 'Error desconocido'));
            return;
        }
        
        alert('✅ Reserva completada exitosamente');
        cargarMisReservas();
    } catch (error) {
        console.error('Error al completar reserva:', error);
        alert('Error de conexión con el servidor');
    }
}
