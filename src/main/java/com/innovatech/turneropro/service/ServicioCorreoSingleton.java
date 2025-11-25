package com.innovatech.turneropro.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import java.io.IOException;

/**
 * Servicio singleton para envío de correos electrónicos usando SendGrid HTTP API
 * Compatible con Render Free (no usa puertos SMTP bloqueados)
 */
public class ServicioCorreoSingleton {

    private static ServicioCorreoSingleton instancia;

    private final String apiKey;
    private final String remitente;
    private final SendGrid sendGridClient;

    private ServicioCorreoSingleton() {
        // Leer configuración desde variables de entorno
        this.apiKey = System.getenv().getOrDefault("SENDGRID_API_KEY", 
                      System.getenv().getOrDefault("MAIL_PASSWORD", ""));
        this.remitente = System.getenv().getOrDefault("MAIL_FROM", "babero2025@gmail.com");
        
        // Inicializar cliente SendGrid
        this.sendGridClient = new SendGrid(this.apiKey);
        
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("📧 Inicializando ServicioCorreoSingleton...");
        System.out.println("   Remitente: " + remitente);
        System.out.println("   API Key configurado: " + (apiKey != null && !apiKey.isEmpty() ? "✅ SÍ" : "❌ NO"));
        System.out.println("   Método: SendGrid HTTP API (compatible con Render Free)");
        System.out.println("   Entorno: " + (System.getenv("RENDER") != null ? "RENDER" : "LOCAL"));
        System.out.println("✅ ServicioCorreoSingleton inicializado correctamente");
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    public static synchronized ServicioCorreoSingleton getInstancia() {
        if (instancia == null) {
            instancia = new ServicioCorreoSingleton();
        }
        return instancia;
    }

    public boolean enviarCorreo(String destinatario, String asunto, String cuerpoHTML) {
        System.out.println("\n📤 Intentando enviar correo via SendGrid HTTP API...");
        System.out.println("   Destinatario: " + destinatario);
        System.out.println("   Asunto: " + asunto);
        
        try {
            Email from = new Email(remitente, "TurneroPro");
            Email to = new Email(destinatario);
            Content content = new Content("text/html", cuerpoHTML);
            Mail mail = new Mail(from, asunto, to, content);

            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            
            Response response = sendGridClient.api(request);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("✅ ¡Correo enviado exitosamente a: " + destinatario + "!");
                System.out.println("   Status: " + response.getStatusCode());
                return true;
            } else {
                System.err.println("❌ ERROR AL ENVIAR CORREO:");
                System.err.println("   Status Code: " + response.getStatusCode());
                System.err.println("   Response Body: " + response.getBody());
                return false;
            }
            
        } catch (IOException e) {
            System.err.println("\n❌ ERROR AL ENVIAR CORREO:");
            System.err.println("   Destinatario: " + destinatario);
            System.err.println("   Error: " + e.getMessage());
            e.printStackTrace();
            
            // Diagnóstico específico
            if (e.getMessage().contains("Unauthorized") || e.getMessage().contains("401")) {
                System.err.println("\n⚠️  DIAGNÓSTICO: API Key incorrecta");
                System.err.println("   Verifica la variable SENDGRID_API_KEY o MAIL_PASSWORD en Render");
            }
            
            return false;
        } catch (Exception e) {
            System.err.println("❌ Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public boolean enviarCorreoTextoPlano(String destinatario, String asunto, String cuerpoTexto) {
        System.out.println("\n📤 Intentando enviar correo de texto plano via SendGrid HTTP API...");
        System.out.println("   Destinatario: " + destinatario);
        System.out.println("   Asunto: " + asunto);
        
        try {
            Email from = new Email(remitente, "TurneroPro");
            Email to = new Email(destinatario);
            Content content = new Content("text/plain", cuerpoTexto);
            Mail mail = new Mail(from, asunto, to, content);

            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            
            Response response = sendGridClient.api(request);
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("✅ Correo de texto plano enviado a: " + destinatario);
                return true;
            } else {
                System.err.println("❌ Error al enviar correo. Status: " + response.getStatusCode());
                return false;
            }
            
        } catch (IOException e) {
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
