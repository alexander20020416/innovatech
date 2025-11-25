package com.innovatech.turneropro.service;

import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;

/**
 * Servicio singleton para envío de correos electrónicos usando Jakarta Mail API
 * Configurado específicamente para Gmail SMTP con App Password
 */
public class ServicioCorreoSingleton {

    private static ServicioCorreoSingleton instancia;

    // ✅ Configuración desde variables de entorno (seguro para producción)
    private final String remitente;
    private final String clave;

    private final Session sesion;

    private ServicioCorreoSingleton() throws MessagingException {
        // Leer credenciales desde variables de entorno
        // Para SendGrid: MAIL_FROM es el remitente, MAIL_USERNAME es 'apikey'
        this.remitente = System.getenv().getOrDefault("MAIL_FROM", "turneropro2025@gmail.com");
        this.clave = System.getenv().getOrDefault("MAIL_PASSWORD", "tbeagxwqlhlcgpll");
        
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("📧 Inicializando ServicioCorreoSingleton...");
        System.out.println("   Remitente: " + remitente);
        System.out.println("   Password configurado: " + (clave != null && !clave.isEmpty() ? "✅ SÍ" : "❌ NO"));
        System.out.println("   Entorno: " + (System.getenv("RENDER") != null ? "RENDER" : "LOCAL"));
        
        this.sesion = crearSesionSMTP();
        
        System.out.println("✅ ServicioCorreoSingleton inicializado correctamente");
        System.out.println("🔐 Protocolo: Gmail SMTP over TLS (587)");
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    public static synchronized ServicioCorreoSingleton getInstancia() throws MessagingException {
        if (instancia == null) {
            instancia = new ServicioCorreoSingleton();
        }
        return instancia;
    }

    private Session crearSesionSMTP() {
        Properties props = new Properties();
        
        // Leer configuración desde variables de entorno (soporta Gmail y SendGrid)
        String smtpHost = System.getenv().getOrDefault("MAIL_HOST", "smtp.gmail.com");
        String smtpPort = System.getenv().getOrDefault("MAIL_PORT", "587");
        
        System.out.println("📧 Configuración SMTP:");
        System.out.println("   Host: " + smtpHost);
        System.out.println("   Port: " + smtpPort);
        
        // Configuración SMTP
        props.put("mail.smtp.host", smtpHost);
        props.put("mail.smtp.port", smtpPort);
        props.put("mail.smtp.auth", "true");
        
        // STARTTLS (requerido por Gmail)
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        
        // Configuración SSL/TLS mejorada para Render
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        props.put("mail.smtp.ssl.trust", smtpHost);
        props.put("mail.smtp.ssl.checkserveridentity", "true");
        
        // Configuración adicional para evitar problemas de certificados en contenedores
        props.put("mail.smtp.socketFactory.fallback", "false");
        
        // Timeouts aumentados para conexiones de Render
        props.put("mail.smtp.connectiontimeout", "30000");
        props.put("mail.smtp.timeout", "30000");
        props.put("mail.smtp.writetimeout", "30000");
        
        // Debug solo en desarrollo
        boolean isProduction = System.getenv("RENDER") != null;
        props.put("mail.debug", isProduction ? "false" : "true");

        return Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                // Para SendGrid: username es 'apikey', para Gmail es el email
                String username = System.getenv().getOrDefault("MAIL_USERNAME", remitente);
                return new PasswordAuthentication(username, clave);
            }
        });
    }

    public boolean enviarCorreo(String destinatario, String asunto, String cuerpoHTML) {
        System.out.println("\n📤 Intentando enviar correo...");
        System.out.println("   Destinatario: " + destinatario);
        System.out.println("   Asunto: " + asunto);
        
        try {
            Message mensaje = new MimeMessage(sesion);
            mensaje.setFrom(new InternetAddress(remitente, "TurneroPro"));
            mensaje.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destinatario));
            mensaje.setSubject(asunto);
            mensaje.setContent(cuerpoHTML, "text/html; charset=utf-8");

            // Enviar mensaje
            Transport.send(mensaje);
            
            System.out.println("✅ ¡Correo enviado exitosamente a: " + destinatario + "!");
            return true;
            
        } catch (MessagingException e) {
            System.err.println("\n❌ ERROR AL ENVIAR CORREO:");
            System.err.println("   Destinatario: " + destinatario);
            System.err.println("   Error: " + e.getMessage());
            e.printStackTrace();
            
            // Diagnóstico específico
            if (e.getMessage().contains("535-5.7.8 Username and Password not accepted")) {
                System.err.println("\n⚠️  DIAGNÓSTICO: Credenciales incorrectas");
                System.err.println("   Verifica que estés usando un App Password de Gmail (16 caracteres)");
                System.err.println("   Genera uno en: https://myaccount.google.com/apppasswords");
            } else if (e.getMessage().contains("Connection timed out")) {
                System.err.println("\n⚠️  DIAGNÓSTICO: Problema de conexión");
                System.err.println("   Verifica la conexión a Internet y el firewall");
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("❌ Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public boolean enviarCorreoTextoPlano(String destinatario, String asunto, String cuerpoTexto) {
        try {
            Message mensaje = new MimeMessage(sesion);
            mensaje.setFrom(new InternetAddress(remitente, "TurneroPro"));
            mensaje.setRecipients(Message.RecipientType.TO, InternetAddress.parse(destinatario));
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpoTexto);

            Transport.send(mensaje);
            System.out.println("✅ Correo de texto plano enviado a: " + destinatario);
            return true;
            
        } catch (MessagingException e) {
            System.err.println("❌ Error al enviar correo de texto plano a: " + destinatario);
            e.printStackTrace();
            return false;
        } catch (Exception e) {
            System.err.println("❌ Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
