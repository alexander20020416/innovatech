# 🚀 Guía de Despliegue en Render - TurneroPro

## 📋 Problema Resuelto

**Problema:** Los correos funcionan localmente pero NO en el dominio de Render.

**Causa:** Credenciales hardcodeadas + falta de configuración de variables de entorno en Render.

**Solución:** Ahora las credenciales se leen desde variables de entorno que debes configurar en Render.

---

## ⚙️ Paso 1: Configurar Variables de Entorno en Render

1. **Accede a tu proyecto en Render:**
   - Ve a: https://dashboard.render.com
   - Selecciona tu servicio `turneropro`

2. **Ir a Environment Variables:**
   - En el menú lateral, haz clic en **"Environment"**

3. **Agregar las siguientes variables:**

   ```env
   MAIL_USERNAME=turneropro2025@gmail.com
   MAIL_PASSWORD=tbeagxwqlhlcgpll
   MAIL_FROM=turneropro2025@gmail.com
   ```

   ⚠️ **IMPORTANTE:** 
   - `MAIL_PASSWORD` debe ser el **App Password** de Gmail (16 caracteres sin espacios)
   - NO uses tu contraseña de Gmail normal
   - Si no tienes un App Password, genera uno siguiendo el Paso 2

4. **Guardar cambios:**
   - Haz clic en **"Save Changes"**
   - Render automáticamente redespleará tu aplicación

---

## 🔐 Paso 2: Generar App Password de Gmail (si no lo tienes)

1. **Ir a tu cuenta de Google:**
   - https://myaccount.google.com/security

2. **Activar verificación en 2 pasos:**
   - Necesaria para crear App Passwords

3. **Crear App Password:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Nombre de la app: "TurneroPro Render"
   - Copiar el password generado (16 caracteres)
   - Usar ese password en `MAIL_PASSWORD`

---

## 📦 Paso 3: Desplegar Cambios en Render

### Opción A: Desde GitHub (Recomendado)

1. **Hacer commit de los cambios:**
   ```powershell
   git add .
   git commit -m "fix: configurar envío de correos para Render con variables de entorno"
   git push origin main
   ```

2. **Render detectará el push automáticamente:**
   - Iniciará el build
   - Reconstruirá el Docker image
   - Desplegará la nueva versión

### Opción B: Manual Deploy

1. En Render Dashboard, ve a tu servicio
2. Haz clic en **"Manual Deploy"** → **"Deploy latest commit"**

---

## ✅ Paso 4: Verificar que Funciona

### 1. Ver los Logs de Render:

```
Render Dashboard → tu servicio → Logs
```

Busca estos mensajes al iniciar:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Inicializando ServicioCorreoSingleton...
   Remitente: turneropro2025@gmail.com
   Password configurado: ✅ SÍ
   Entorno: RENDER
✅ ServicioCorreoSingleton inicializado correctamente
🔐 Protocolo: Gmail SMTP over TLS (587)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Probar enviando un correo desde la app:

1. Ir a tu dominio: `https://tu-app.onrender.com`
2. Crear una reserva
3. Verificar que llegue el correo de confirmación

### 3. Si hay errores, revisar logs:

**Buscar estos mensajes de error:**

- `❌ ERROR AL ENVIAR CORREO` → Ver detalles del error
- `535-5.7.8 Username and Password not accepted` → App Password incorrecto
- `Connection timed out` → Firewall bloqueando puerto 587

---

## 🐛 Troubleshooting

### ❌ Error: "535-5.7.8 Username and Password not accepted"

**Causa:** App Password incorrecto o cuenta de Gmail sin verificación en 2 pasos.

**Solución:**
1. Verifica que `MAIL_PASSWORD` sea el App Password (no tu contraseña normal)
2. Asegúrate de que la verificación en 2 pasos esté activada
3. Genera un nuevo App Password si es necesario

### ❌ Error: "Connection timed out"

**Causa:** Firewall de Render bloqueando puerto 587.

**Solución:**
1. Render FREE tier puede tener limitaciones de red
2. Considera usar un servicio SMTP dedicado como SendGrid o Mailgun (tienen planes gratuitos)

### ❌ Error: "Password configurado: ❌ NO"

**Causa:** Variable `MAIL_PASSWORD` no configurada en Render.

**Solución:**
1. Ve a Render Dashboard → Environment
2. Agrega `MAIL_PASSWORD` con el App Password
3. Guarda y redespliega

---

## 🔧 Configuración Adicional (Opcional)

### Cambiar de Gmail a SendGrid (si hay problemas)

Si Render bloquea Gmail, usa SendGrid:

1. **Crear cuenta gratis en SendGrid:**
   - https://sendgrid.com (100 emails/día gratis)

2. **Obtener API Key:**
   - SendGrid Dashboard → Settings → API Keys

3. **Actualizar variables en Render:**
   ```env
   MAIL_HOST=smtp.sendgrid.net
   MAIL_PORT=587
   MAIL_USERNAME=apikey
   MAIL_PASSWORD=tu-api-key-de-sendgrid
   MAIL_FROM=turneropro2025@gmail.com
   ```

4. **Modificar `ServicioCorreoSingleton.java`:**
   ```java
   // En crearSesionSMTP(), cambiar:
   props.put("mail.smtp.host", System.getenv().getOrDefault("MAIL_HOST", "smtp.gmail.com"));
   props.put("mail.smtp.port", System.getenv().getOrDefault("MAIL_PORT", "587"));
   ```

---

## 📊 Monitoreo

### Ver logs en tiempo real:

```bash
# Desde Render Dashboard
Logs → Enable Auto-scroll
```

### Verificar que los correos se envían:

```
📤 Intentando enviar correo...
   Destinatario: cliente@gmail.com
   Asunto: Confirmación de Reserva
✅ ¡Correo enviado exitosamente a: cliente@gmail.com!
```

---

## 🎯 Checklist de Configuración

- [ ] Variables de entorno configuradas en Render (`MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`)
- [ ] App Password de Gmail generado correctamente (16 caracteres)
- [ ] Verificación en 2 pasos activada en Gmail
- [ ] Código actualizado y pusheado a GitHub
- [ ] Render ha redespleado la aplicación
- [ ] Logs muestran "ServicioCorreoSingleton inicializado correctamente"
- [ ] Prueba de envío de correo realizada exitosamente

---

## 📝 Notas Importantes

1. **Seguridad:**
   - NUNCA subas credenciales al código fuente
   - Usa siempre variables de entorno
   - El App Password de Gmail es independiente de tu contraseña

2. **Límites de Gmail:**
   - Gmail permite ~500 correos/día desde aplicaciones
   - Si superas el límite, considera SendGrid o Mailgun

3. **Render Free Tier:**
   - Puede haber límites de red
   - Si persisten problemas, considera el plan Starter ($7/mes)

---

## 🆘 Soporte

Si sigues teniendo problemas:

1. Revisa los logs completos en Render
2. Verifica que las variables de entorno estén correctas
3. Prueba con SendGrid si Gmail no funciona
4. Contacta a soporte de Render: https://render.com/docs/support

---

**✅ Con estos cambios, los correos deberían funcionar correctamente en Render.**
