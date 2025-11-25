package com.innovatech.turneropro.service;

import com.innovatech.turneropro.model.Reserva;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private ServicioCorreoSingleton servicioCorreo;

    public EmailService() {
        this.servicioCorreo = ServicioCorreoSingleton.getInstancia();
    }
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    
    public void enviarConfirmacionReserva(Reserva reserva) {
        try {
            String asunto = "Confirmación de Reserva - TurneroPro";
            
            String cuerpoHtml = String.format(
                "<html><body>" +
                "<h2>Hola %s,</h2>" +
                "<p>Tu reserva ha sido confirmada exitosamente.</p>" +
                "<h3>Detalles de la reserva:</h3>" +
                "<ul>" +
                "<li><strong>Barbero:</strong> %s</li>" +
                "<li><strong>Servicio:</strong> %s</li>" +
                "<li><strong>Fecha y hora:</strong> %s</li>" +
                "<li><strong>Duración aproximada:</strong> %d minutos</li>" +
                "</ul>" +
                "<p>¡Te esperamos!</p>" +
                "<p><em>Equipo TurneroPro - Barber Shop Edition</em></p>" +
                "</body></html>",
                reserva.getCliente().getNombreCompleto(),
                reserva.getBarbero().getNombreCompleto(),
                reserva.getServicio().getNombre(),
                reserva.getFechaHoraInicio().format(FORMATTER),
                reserva.getServicio().getDuracionMinutos()
            );
            
            servicioCorreo.enviarCorreo(
                reserva.getCliente().getEmail(),
                asunto,
                cuerpoHtml
            );
            
        } catch (Exception e) {
            System.err.println("❌ ERROR al enviar email de confirmación: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public void enviarCancelacionReserva(Reserva reserva) {
        try {
            // Email al cliente
            String asuntoCliente = "Cancelación de Reserva - TurneroPro";
            String cuerpoHtmlCliente = String.format(
                "<html><body>" +
                "<h2>Hola %s,</h2>" +
                "<p>Tu reserva ha sido cancelada.</p>" +
                "<h3>Detalles de la reserva cancelada:</h3>" +
                "<ul>" +
                "<li><strong>Barbero:</strong> %s</li>" +
                "<li><strong>Servicio:</strong> %s</li>" +
                "<li><strong>Fecha y hora:</strong> %s</li>" +
                "<li><strong>Motivo:</strong> %s</li>" +
                "</ul>" +
                "<p>Puedes realizar una nueva reserva cuando lo desees.</p>" +
                "<p><em>Equipo TurneroPro - Barber Shop Edition</em></p>" +
                "</body></html>",
                reserva.getCliente().getNombreCompleto(),
                reserva.getBarbero().getNombreCompleto(),
                reserva.getServicio().getNombre(),
                reserva.getFechaHoraInicio().format(FORMATTER),
                reserva.getMotivoCancelacion() != null ? reserva.getMotivoCancelacion() : "No especificado"
            );
            
            servicioCorreo.enviarCorreo(
                reserva.getCliente().getEmail(),
                asuntoCliente,
                cuerpoHtmlCliente
            );
            
            // Email al barbero
            String asuntoBarbero = "Cancelación de Reserva - TurneroPro";
            String cuerpoHtmlBarbero = String.format(
                "<html><body>" +
                "<h2>Hola %s,</h2>" +
                "<p>Se ha cancelado una reserva:</p>" +
                "<h3>Detalles:</h3>" +
                "<ul>" +
                "<li><strong>Cliente:</strong> %s</li>" +
                "<li><strong>Servicio:</strong> %s</li>" +
                "<li><strong>Fecha y hora:</strong> %s</li>" +
                "</ul>" +
                "<p><em>Equipo TurneroPro - Barber Shop Edition</em></p>" +
                "</body></html>",
                reserva.getBarbero().getNombreCompleto(),
                reserva.getCliente().getNombreCompleto(),
                reserva.getServicio().getNombre(),
                reserva.getFechaHoraInicio().format(FORMATTER)
            );
            
            servicioCorreo.enviarCorreo(
                reserva.getBarbero().getEmail(),
                asuntoBarbero,
                cuerpoHtmlBarbero
            );
            
            System.out.println("Emails de cancelación enviados");
        } catch (Exception e) {
            System.err.println("Error al enviar email de cancelación: " + e.getMessage());
        }
    }
    
    public void enviarNotificacionNuevaReserva(Reserva reserva) {
        try {
            String asunto = "Nueva Reserva - TurneroPro";
            
            String cuerpoHtml = String.format(
                "<html><body>" +
                "<h2>Hola %s,</h2>" +
                "<p>Tienes una nueva reserva:</p>" +
                "<h3>Detalles:</h3>" +
                "<ul>" +
                "<li><strong>Cliente:</strong> %s</li>" +
                "<li><strong>Servicio:</strong> %s</li>" +
                "<li><strong>Fecha y hora:</strong> %s</li>" +
                "<li><strong>Duración:</strong> %d minutos</li>" +
                "<li><strong>Teléfono cliente:</strong> %s</li>" +
                "</ul>" +
                "<p><em>Equipo TurneroPro - Barber Shop Edition</em></p>" +
                "</body></html>",
                reserva.getBarbero().getNombreCompleto(),
                reserva.getCliente().getNombreCompleto(),
                reserva.getServicio().getNombre(),
                reserva.getFechaHoraInicio().format(FORMATTER),
                reserva.getServicio().getDuracionMinutos(),
                reserva.getCliente().getTelefono() != null ? reserva.getCliente().getTelefono() : "No proporcionado"
            );
            
            servicioCorreo.enviarCorreo(
                reserva.getBarbero().getEmail(),
                asunto,
                cuerpoHtml
            );
            
            System.out.println("Email de nueva reserva enviado a barbero: " + reserva.getBarbero().getEmail());
        } catch (Exception e) {
            System.err.println("Error al enviar email de nueva reserva al barbero: " + e.getMessage());
        }
    }
    
    public void enviarNotificacionReprogramacion(Reserva reserva) {
        try {
            // Email al cliente
            String asuntoCliente = "Reserva Reprogramada - TurneroPro";
            String cuerpoHtmlCliente = String.format(
                "<html><body>" +
                "<h2>Hola %s,</h2>" +
                "<p>Tu reserva ha sido reprogramada exitosamente.</p>" +
                "<h3>Nuevos detalles:</h3>" +
                "<ul>" +
                "<li><strong>Barbero:</strong> %s</li>" +
                "<li><strong>Servicio:</strong> %s</li>" +
                "<li><strong>Nueva fecha y hora:</strong> %s</li>" +
                "<li><strong>Duración aproximada:</strong> %d minutos</li>" +
                "</ul>" +
                "<p>¡Te esperamos!</p>" +
                "<p><em>Equipo TurneroPro - Barber Shop Edition</em></p>" +
                "</body></html>",
                reserva.getCliente().getNombreCompleto(),
                reserva.getBarbero().getNombreCompleto(),
                reserva.getServicio().getNombre(),
                reserva.getFechaHoraInicio().format(FORMATTER),
                reserva.getServicio().getDuracionMinutos()
            );
            
            servicioCorreo.enviarCorreo(
                reserva.getCliente().getEmail(),
                asuntoCliente,
                cuerpoHtmlCliente
            );
            
            // Email al barbero
            String asuntoBarbero = "Reserva Reprogramada - TurneroPro";
            String cuerpoHtmlBarbero = String.format(
                "<html><body>" +
                "<h2>Hola %s,</h2>" +
                "<p>Se ha reprogramado una reserva:</p>" +
                "<h3>Detalles:</h3>" +
                "<ul>" +
                "<li><strong>Cliente:</strong> %s</li>" +
                "<li><strong>Servicio:</strong> %s</li>" +
                "<li><strong>Nueva fecha y hora:</strong> %s</li>" +
                "<li><strong>Teléfono cliente:</strong> %s</li>" +
                "</ul>" +
                "<p><em>Equipo TurneroPro - Barber Shop Edition</em></p>" +
                "</body></html>",
                reserva.getBarbero().getNombreCompleto(),
                reserva.getCliente().getNombreCompleto(),
                reserva.getServicio().getNombre(),
                reserva.getFechaHoraInicio().format(FORMATTER),
                reserva.getCliente().getTelefono() != null ? reserva.getCliente().getTelefono() : "No proporcionado"
            );
            
            servicioCorreo.enviarCorreo(
                reserva.getBarbero().getEmail(),
                asuntoBarbero,
                cuerpoHtmlBarbero
            );
            
            System.out.println("Emails de reprogramación enviados");
        } catch (Exception e) {
            System.err.println("Error al enviar emails de reprogramación: " + e.getMessage());
        }
    }
    
    public void enviarRecordatorio24Horas(Reserva reserva) {
        try {
            String asunto = "Recordatorio de Cita - TurneroPro";
            
            String cuerpoHtml = String.format(
                "<html><body>" +
                "<h2>Hola %s,</h2>" +
                "<p>Te recordamos que tienes una cita mañana:</p>" +
                "<h3>Detalles:</h3>" +
                "<ul>" +
                "<li><strong>Barbero:</strong> %s</li>" +
                "<li><strong>Servicio:</strong> %s</li>" +
                "<li><strong>Fecha y hora:</strong> %s</li>" +
                "<li><strong>Dirección:</strong> [Dirección de la barbería]</li>" +
                "</ul>" +
                "<p>Si necesitas cancelar o reprogramar, puedes hacerlo desde tu panel de cliente.</p>" +
                "<p>¡Te esperamos!</p>" +
                "<p><em>Equipo TurneroPro - Barber Shop Edition</em></p>" +
                "</body></html>",
                reserva.getCliente().getNombreCompleto(),
                reserva.getBarbero().getNombreCompleto(),
                reserva.getServicio().getNombre(),
                reserva.getFechaHoraInicio().format(FORMATTER)
            );
            
            servicioCorreo.enviarCorreo(
                reserva.getCliente().getEmail(),
                asunto,
                cuerpoHtml
            );
            
            System.out.println("Recordatorio de 24h enviado a: " + reserva.getCliente().getEmail());
        } catch (Exception e) {
            System.err.println("Error al enviar recordatorio: " + e.getMessage());
        }
    }
}
