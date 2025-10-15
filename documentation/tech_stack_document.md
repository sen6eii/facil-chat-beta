# Tech Stack Document for FácilChat

Este documento explica, en un lenguaje sencillo y accesible, las decisiones tecnológicas detrás de FácilChat. Cada sección detalla por qué se eligió cada herramienta y cómo contribuye al objetivo de centralizar conversaciones de WhatsApp Business para pequeñas y medianas empresas.

## 1. Frontend Technologies

Las tecnologías y herramientas usadas para la interfaz de usuario de FácilChat son:

*   **Next.js (React + TypeScript)**

    *   Framework basado en React que aporta renderizado en servidor (SSR) y rutas fáciles de configurar.
    *   TypeScript suma tipado estático, reduciendo errores y mejorando la mantenibilidad.

*   **CSS Modules y CSS global**

    *   Permite estilos encapsulados por componente y variables globales para colores (verde #25D366, blanco #FFFFFF, gris claro #F0F0F0).

*   **Fuente Poppins**

    *   Tipografía clara y moderna, cargada desde Google Fonts para garantizar buena legibilidad en español.

*   **Spanish-only UI**

    *   Todos los textos, botones y mensajes están en español, con marcadores de posición siguiendo buenas prácticas de UX.

Cómo mejora la experiencia del usuario:

*   Navegación rápida e intuitiva gracias al enrutado de Next.js.
*   Componentes reutilizables con CSS Modules para coherencia visual.
*   SSR y división de código automáticos de Next.js reducen los tiempos de carga.

## 2. Backend Technologies

El servidor y la gestión de datos se apoyan en:

*   **Supabase**

    *   **Auth**: Inicio de sesión con Google (Google Sign-In), gestión de sesiones y un único rol “Administrador del negocio”.
    *   **Database** (PostgreSQL): Tablas `users`, `clients`, `labels`, `client_labels`, `messages`, `faqs`.
    *   **Storage**: Almacenamiento de logos de negocio.
    *   **Realtime**: Suscripciones en tiempo real para métricas y mensajes.

*   **Next.js API Routes**

    *   Funciones serverless que reciben webhooks de Twilio, ejecutan lógica de FAQs y guardan datos en Supabase.

*   **Twilio WhatsApp API**

    *   Envío y recepción de mensajes de texto vía webhooks.
    *   Integración preparada para múltiples números, pero en MVP usa credenciales globales.

Cómo trabajan juntos:

1.  Cuando llega un mensaje, Twilio envía un webhook a `/api/twilio/webhook`.
2.  La función API de Next.js lo recibe, guarda la entrada en Supabase y busca coincidencias con las FAQs.
3.  Si encuentra una respuesta, la envía de vuelta vía Twilio; si no, usa un mensaje de fallback.
4.  Supabase Realtime notifica al frontend para actualizar métricas y listas sin recargar la página.

## 3. Infrastructure and Deployment

La infraestructura y el flujo de despliegue aseguran fiabilidad y escalabilidad:

*   **Vercel**

    *   Hospeda el frontend Next.js con despliegues automáticos en cada push a la rama principal.
    *   HTTPS obligatorio y certificado gestionado automáticamente.

*   **Supabase Hosted**

    *   Base de datos, autenticación, storage y realtime.

*   **Git & GitHub**

    *   Control de versiones y colaboración. Cada cambio revisado mediante pull requests antes de desplegar.

*   **CI/CD**

    *   Vercel se integra con GitHub y ejecuta build/test automáticamente.

*   **Variables de Entorno**

    *   Almacenan secretos (Twilio SID/Token, URL de webhook, credenciales de Supabase) fuera del código fuente.

Cómo contribuye a la escalabilidad:

*   Despliegues continuos reducen la fricción entre desarrollo y producción.
*   Infraestructura serverless (Vercel, Supabase) escala con la demanda sin administración de servidores.

## 4. Third-Party Integrations

FácilChat se apoya en servicios externos para funciones clave:

*   **Twilio WhatsApp API**

    *   Gestión de mensajes de texto entrantes y salientes.
    *   Webhook único preparado para diferenciar negocios por número.

*   **Google Sign-In (OAuth)**

    *   Autenticación sencilla sin manejo de contraseñas.

*   **Supabase**

    *   Varios servicios (Auth, Database, Storage, Realtime) en una sola plataforma.

Beneficios de estas integraciones:

*   Evitan desarrollar desde cero infraestructuras complejas (mensajería, OAuth, BBDD).
*   Facilitan futuras ampliaciones (Instagram DMs, bots de IA) al tener APIs modulables.

## 5. Security and Performance Considerations

Medidas de seguridad:

*   **Secretos en variables de entorno**: Nunca expuestos al cliente.
*   **HTTPS forzado**: Vercel lo gestiona.
*   **Row-Level Security de Supabase**: Políticas que restringen el acceso a los datos de cada negocio.
*   **Validación de formato E.164**: Campos de teléfono controlados para evitar errores.

Optimización de rendimiento:

*   **SSR y Code Splitting (Next.js)**: Carga solo el JavaScript necesario en cada página.
*   **Supabase Realtime**: Actualizaciones de métricas y mensajes en < 1 segundo.
*   **Imágenes optimizadas**: Logo y avatars servidos en formatos ligeros vía Supabase Storage.
*   **Carga diferida**: Componentes y módulos se cargan solo cuando el usuario los necesita.

## 6. Conclusion and Overall Tech Stack Summary

En resumen, FácilChat utiliza una combinación de tecnologías modernas y probadas para ofrecer un MVP robusto, modular y fácil de mantener:

*   Frontend: Next.js + React + TypeScript, CSS Modules, Poppins
*   Backend: Supabase (Auth, Database, Storage, Realtime) y Next.js API Routes
*   Integración de mensajería: Twilio WhatsApp API
*   Autenticación: Google Sign-In
*   Despliegue e Infraestructura: Vercel + GitHub CI/CD

Estas elecciones garantizan:

*   **Rapidez de desarrollo**: Plataformas BaaS y serverless.
*   **Buena experiencia de usuario**: SSR, actualizaciones en tiempo real y diseño familiar en español.
*   **Escalabilidad**: Infraestructura que crece con la demanda y código preparado para futuras integraciones.
*   **Seguridad**: Políticas de acceso, manejo seguro de secretos y HTTPS.

Con esta base técnica, FácilChat cumple sus objetivos de centralizar conversaciones de WhatsApp, automatizar respuestas frecuentes y ofrecer métricas esenciales, todo con un entorno preparado para evolucionar en fases futuras.
