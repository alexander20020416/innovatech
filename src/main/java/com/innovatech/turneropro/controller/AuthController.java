package com.innovatech.turneropro.controller;

import com.innovatech.turneropro.dto.AuthResponse;
import com.innovatech.turneropro.dto.LoginRequest;
import com.innovatech.turneropro.dto.RegistroRequest;
import com.innovatech.turneropro.model.Usuario;
import com.innovatech.turneropro.repository.UsuarioRepository;
import com.innovatech.turneropro.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@Valid @RequestBody RegistroRequest request) {
        try {
            AuthResponse response = authService.registrarUsuario(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log del error real para debugging
            System.out.println("===== ERROR EN LOGIN =====");
            System.out.println("Mensaje: " + e.getMessage());
            System.out.println("Tipo: " + e.getClass().getName());
            e.printStackTrace();
            System.out.println("==========================");
            return ResponseEntity.badRequest().body(new ErrorResponse("Credenciales inválidas: " + e.getMessage()));
        }
    }
    
    @PutMapping("/perfil")
    public ResponseEntity<?> actualizarPerfil(
            @RequestBody ActualizarPerfilRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Usuario usuario = usuarioRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            // Actualizar datos básicos
            usuario.setNombreCompleto(request.getNombreCompleto());
            usuario.setEmail(request.getEmail());
            if (request.getTelefono() != null) {
                usuario.setTelefono(request.getTelefono());
            }
            
            // Cambiar contraseña si se proporciona
            if (request.getPasswordActual() != null && request.getPasswordNueva() != null) {
                if (!passwordEncoder.matches(request.getPasswordActual(), usuario.getPassword())) {
                    return ResponseEntity.badRequest()
                            .body(new ErrorResponse("La contraseña actual es incorrecta"));
                }
                usuario.setPassword(passwordEncoder.encode(request.getPasswordNueva()));
            }
            
            usuarioRepository.save(usuario);
            
            // Devolver usuario actualizado
            PerfilResponse response = new PerfilResponse(
                    usuario.getId(),
                    usuario.getUsername(),
                    usuario.getEmail(),
                    usuario.getNombreCompleto(),
                    usuario.getTelefono(),
                    usuario.getRol().name()
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Clase auxiliar para respuestas de error
    static class ErrorResponse {
        private String mensaje;
        
        public ErrorResponse(String mensaje) {
            this.mensaje = mensaje;
        }
        
        public String getMensaje() {
            return mensaje;
        }
        
        public void setMensaje(String mensaje) {
            this.mensaje = mensaje;
        }
    }
    
    // DTO para actualizar perfil
    static class ActualizarPerfilRequest {
        private String nombreCompleto;
        private String email;
        private String telefono;
        private String passwordActual;
        private String passwordNueva;
        
        public String getNombreCompleto() { return nombreCompleto; }
        public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getTelefono() { return telefono; }
        public void setTelefono(String telefono) { this.telefono = telefono; }
        
        public String getPasswordActual() { return passwordActual; }
        public void setPasswordActual(String passwordActual) { this.passwordActual = passwordActual; }
        
        public String getPasswordNueva() { return passwordNueva; }
        public void setPasswordNueva(String passwordNueva) { this.passwordNueva = passwordNueva; }
    }
    
    // DTO para respuesta de perfil
    static class PerfilResponse {
        private Long id;
        private String username;
        private String email;
        private String nombreCompleto;
        private String telefono;
        private String rol;
        
        public PerfilResponse(Long id, String username, String email, String nombreCompleto, String telefono, String rol) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.nombreCompleto = nombreCompleto;
            this.telefono = telefono;
            this.rol = rol;
        }
        
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getNombreCompleto() { return nombreCompleto; }
        public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
        
        public String getTelefono() { return telefono; }
        public void setTelefono(String telefono) { this.telefono = telefono; }
        
        public String getRol() { return rol; }
        public void setRol(String rol) { this.rol = rol; }
    }
}
