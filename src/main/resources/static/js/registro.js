// Detectar si estamos en local o en producción
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081/api'
    : window.location.origin + '/api';

document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        nombreCompleto: document.getElementById('nombreCompleto').value,
        telefono: document.getElementById('telefono').value,
        rol: document.getElementById('rol').value
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Registro exitoso. Guardando datos...');
            
            // Guardar token y datos de usuario
            const usuarioData = {
                id: result.id,
                username: result.username,
                email: result.email,
                nombreCompleto: result.nombreCompleto,
                rol: result.rol
            };
            
            try {
                localStorage.setItem('token', result.token);
                localStorage.setItem('usuario', JSON.stringify(usuarioData));
                
                // VERIFICAR que se guardó correctamente
                const tokenVerificado = localStorage.getItem('token');
                const usuarioVerificado = localStorage.getItem('usuario');
                
                if (!tokenVerificado || !usuarioVerificado) {
                    throw new Error('No se pudo guardar en localStorage');
                }
                
                console.log('✅ Token guardado:', tokenVerificado ? 'Sí' : 'No');
                console.log('✅ Usuario guardado:', result.username, 'Rol:', result.rol);
                
                mostrarMensaje('✅ ¡Registro exitoso! Redirigiendo al panel...', 'success');
                
                // Deshabilitar el formulario
                document.getElementById('formRegistro').style.opacity = '0.5';
                document.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
                
                // Redirigir según el rol después de verificar que se guardó
                setTimeout(() => {
                    console.log('🔄 Iniciando redirección...');
                    
                    let url = '/login.html'; // fallback
                    
                    if (result.rol === 'CLIENTE') {
                        url = '/cliente-panel.html';
                        console.log('🔄 Redirigiendo a cliente-panel.html');
                    } else if (result.rol === 'BARBERO') {
                        url = '/barbero-panel.html';
                        console.log('🔄 Redirigiendo a barbero-panel.html');
                    } else if (result.rol === 'ADMINISTRADOR') {
                        url = '/admin-panel.html';
                        console.log('🔄 Redirigiendo a admin-panel.html');
                    }
                    
                    window.location.replace(url); // usar replace en vez de href
                }, 1500);
                
            } catch (storageError) {
                console.error('❌ Error al guardar en localStorage:', storageError);
                mostrarMensaje('❌ Error al guardar la sesión. Intenta de nuevo.', 'error');
            }
        } else {
            mostrarMensaje('❌ ' + (result.mensaje || 'Error al registrar usuario'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión con el servidor', 'error');
    }
});

function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.innerHTML = `<div class="alert alert-${tipo === 'success' ? 'success' : 'error'}">${texto}</div>`;
    
    setTimeout(() => {
        mensajeDiv.innerHTML = '';
    }, 5000);
}
