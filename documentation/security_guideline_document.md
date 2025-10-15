# Guía de Seguridad para FácilChat

Este documento recoge las prácticas y controles de seguridad que deben implementarse durante el diseño, desarrollo, prueba y despliegue del MVP **FácilChat**. Su objetivo es garantizar que la aplicación sea resistente a ataques, proteja los datos de los usuarios y cumpla con estándares de seguridad modernos.

## 1. Principios de Seguridad

1.  **Seguridad por Diseño**: incorporar controles desde la fase de arquitectura.
2.  **Mínimo Privilegio**: cada componente debe disponer únicamente de los permisos necesarios.
3.  **Defensa en Profundidad**: implementar capas de protección (aplicación, base de datos, red).
4.  **Validación Rigurosa de Entradas y Salidas**: tratar todo dato externo como no confiable.
5.  **Fallar de Forma Segura**: no exponer datos sensibles en mensajes de error.
6.  **Configuraciones Seguras por Defecto**: seguridad activada desde la primera ejecución.
7.  **Simplicidad en Controles**: mecanismos claros y fáciles de auditar.

## 2. Autenticación y Control de Acceso

### 2.1 Google Sign-In y Supabase Auth

*   Usar Supabase Auth con OAuth 2.0 (Google) exclusivamente; no exponer flujo de contraseña.
*   Validar tokens en cada petición del cliente.

### 2.2 Gestión de Sesiones

*   Almacenar `access_token` y `refresh_token` en cookies con atributos `Secure`, `HttpOnly`, `SameSite=Strict`.
*   Implementar tiempo de expiración (idle timeout de 30 minutos, absolute timeout de 24 horas).
*   Proteger contra **session fixation** regenerando identificadores tras login.

### 2.3 Roles y Políticas RLS (Row-Level Security)

*   Definir un único rol “Administrador del negocio”.
*   En Supabase, habilitar RLS y crear políticas que solo permitan al usuario acceder a sus propios registros (`clients.user_id = auth.uid()`).
*   El rol anónimo (`anon`) solo podrá leer rutas públicas (login) y no podrá escribir en tablas protegidas.

## 3. Manejo de Entradas y Procesamiento

*   **Validación de Formatos**: verificar que números de teléfono estén en E.164 (`+598XXXXXXXX`), nombres sin caracteres especiales no permitidos.
*   **Sanitización**: escapar o rechazar cualquier payload que contenga `<script>`, SQL metacaracteres o patrones de inyección.
*   **ORM/Prepared Statements**: usar Supabase Client (PostgREST) o queries parametrizadas, nunca concatenar strings.
*   **Protección CSRF**: incluir token anti-CSRF en formularios de estado (Next.js API routes + cookies SameSite).
*   **Límite de Tamaños**: establecer restricciones de tamaño máximo para uploads (logos) y mensajes (texto).
*   **Validación de Webhook Twilio**: comprobar `X-Twilio-Signature` para garantizar que las peticiones provienen de Twilio.

## 4. Protección de Datos y Privacidad

*   **Transporte Seguro**: forzar HTTPS/TLS 1.2+ en Vercel y Supabase.
*   **Encriptación en Reposo**: confiar en el cifrado por defecto de Supabase (PostgreSQL encriptado).
*   **Gestión de Secretos**: almacenar `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_*` en variables de entorno; no incluir en el repositorio.
*   **Logs**: anonimizar o truncar datos PII en registros de errores.
*   **Cumplimiento GDPR/CCPA**: permitir eliminación completa de datos de un cliente bajo petición.

## 5. Seguridad de APIs y Servicios

*   **HTTPS Obligatorio**: todas las rutas `/api/*` deben responder solo por HTTPS.
*   **Rate Limiting**: configurar límites por IP en las funciones API de Vercel (e.g., 10 req/s al webhook).
*   **CORS Restringido**: permitir solicitudes únicamente desde el dominio de producción (`https://tu-facilchat.vercel.app`).
*   **Versionado de API**: prefijar endpoints (`/api/v1/twilio/webhook`) para futuros cambios.
*   **Principio de Mínima Exposición**: exponer solo los endpoints necesarios; minimizar respuestas a datos esenciales.

## 6. Higiene de Seguridad en la Aplicación Web

*   **Cabeceras HTTP Seguras**:

    *   `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
    *   `Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-...'; style-src 'self';`
    *   `X-Frame-Options: DENY`
    *   `X-Content-Type-Options: nosniff`
    *   `Referrer-Policy: strict-origin-when-cross-origin`

*   **Cookies**: `HttpOnly`, `Secure`, `SameSite=Strict`.

*   **Protección XSS**: usar sanitizadores (e.g., DOMPurify) si se permite HTML; huir de `dangerouslySetInnerHTML`.

*   **Subresource Integrity (SRI)**: aplicar `integrity` y `crossorigin` a librerías CDN.

## 7. Infraestructura y Configuración

*   **Vercel**:

    *   Tener separados entornos *development* y *production*.
    *   Desactivar modos de depuración en producción.
    *   Revisar logs de despliegue y errores con regularidad.

*   **Acceso a Bases de Datos**:

    *   El service role key reside solo en funciones de backend; el cliente usa solo la `anon key`.
    *   Rotar credenciales periódicamente.

*   **Permisos de Archivos**:

    *   Repositorio: restringir push a ramas protegidas.
    *   Storage (logos): rutas privadas, URLs firmadas que expiran.

## 8. Gestión de Dependencias

*   **Lockfile**: usar `package-lock.json` para garantizar versiones deterministas.
*   **Análisis de Vulnerabilidades**: integrar `npm audit` o GitHub Dependabot; corregir CVEs críticos inmediatamente.
*   **Mínimo Requisito**: incluir solo librerías necesarias; evitar dependencias abandonadas.

## 9. Monitoreo y Respuesta a Incidentes

*   **Alertas**: configurar notificaciones (e-mail/Slack) ante:

    *   Fallos en webhook (Twilio unreachable).
    *   Errores 5xx recurrentes en `/api/*`.

*   **Registros de Auditoría**: guardar cambios críticos (creación/edición/archivo de clientes, etiquetas) con `user_id` y timestamp.

*   **Pruebas de Penetración**: realizar escaneos periódicos de vulnerabilidades web (OWASP ZAP, etc.).

## 10. Plan de Recuperación y Continuidad

*   **Backups Automáticos**: habilitar snapshots diarios de la base de datos en Supabase.
*   **Restauración**: documentar pasos para roll-back y restore en menos de 2 horas.
*   **Pruebas de Recuperación**: simular pérdida de datos y verificar procedimiento cada trimestre.

**Cumplir y auditar** estas pautas es obligatorio antes de cualquier entrega o despliegue a producción. Cualquier excepción deberá documentarse y aprobarse con el equipo de seguridad.
