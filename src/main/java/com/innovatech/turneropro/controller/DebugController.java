package com.innovatech.turneropro.controller;

import com.innovatech.turneropro.model.Usuario;
import com.innovatech.turneropro.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @GetMapping("/test-password/{username}")
    public Map<String, Object> testPassword(@PathVariable String username, @RequestParam String password) {
        Map<String, Object> result = new HashMap<>();
        
        Usuario usuario = usuarioRepository.findByUsername(username).orElse(null);
        
        if (usuario == null) {
            result.put("error", "Usuario no encontrado");
            return result;
        }
        
        result.put("username", usuario.getUsername());
        result.put("passwordHash", usuario.getPassword().substring(0, 20) + "...");
        result.put("passwordMatches", passwordEncoder.matches(password, usuario.getPassword()));
        result.put("activo", usuario.getActivo());
        result.put("rol", usuario.getRol().name());
        
        return result;
    }
    
    @GetMapping("/usuarios")
    public Map<String, Object> listarUsuarios() {
        Map<String, Object> result = new HashMap<>();
        result.put("totalUsuarios", usuarioRepository.count());
        result.put("usuarios", usuarioRepository.findAll().stream()
            .map(u -> Map.of(
                "username", u.getUsername(),
                "email", u.getEmail(),
                "activo", u.getActivo(),
                "rol", u.getRol().name()
            ))
            .toList()
        );
        return result;
    }
}
