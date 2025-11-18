// Detectar si estamos en local o en producción
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8081/api'
    : window.location.origin + '/api';

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        usernameOrEmail: document.getElementById('usernameOrEmail').value,
        password: document.getElementById('password').value
    };
    
    console.log('Intentando login con usuario:', data.usernameOrEmail);
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok) {
            console.log('✅ Login exitoso. Guardando datos...');
            
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
                console.log('✅ Verificación completada');
                
                mostrarMensaje('✅ Inicio de sesión exitoso! Redirigiendo...', 'success');
                
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
            console.error('Login fallido:', result);
            mostrarMensaje(result.mensaje || 'Credenciales inválidas', 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarMensaje('❌ Error de conexión con el servidor', 'error');
    }
});

function mostrarMensaje(texto, tipo) {
    const mensajeDiv = document.getElementById('mensaje');
    mensajeDiv.innerHTML = `<div class="alert alert-${tipo === 'success' ? 'success' : 'error'}">${texto}</div>`;
    
    setTimeout(() => {
        mensajeDiv.innerHTML = '';
    }, 5000);
}
