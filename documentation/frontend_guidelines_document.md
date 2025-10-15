# Guía de Frontend para FácilChat

Bienvenido a la guía de frontend de FácilChat. Aquí encontrarás una descripción clara de la arquitectura, principios de diseño y tecnologías que usamos para construir nuestra aplicación web MVP. El objetivo es que cualquier persona, con o sin conocimientos técnicos profundos, pueda entender cómo está armado el frontend.

## 1. Arquitectura del Frontend

### 1.1 Herramientas y Frameworks

*   **Next.js con React y TypeScript**: aprovechamos el renderizado híbrido (SSR/SSG) para un buen rendimiento y SEO. TypeScript nos da seguridad de tipos y autocompletado.
*   **Vercel**: despliegue continuo desde nuestro repositorio, con builds automáticos al hacer push.
*   **Supabase**: usado solo como backend (Auth, base de datos, realtime, storage). No incide directamente en el código del frontend, más allá de nuestras llamadas a su SDK.
*   **Twilio WhatsApp API**: para recibir y enviar mensajes.

### 1.2 Escalabilidad y Mantenimiento

*   **File-based routing** de Next.js mantiene las rutas organizadas y claras.
*   **Componentes desacoplados**: cada pieza de UI vive en su propio archivo/carpeta.
*   **Hooks personalizados**: centralizamos la lógica de llamadas a Supabase y Twilio en hooks reutilizables.
*   **Entorno multi-tenant preparado**: aunque de momento usamos un solo número de WhatsApp, la estructura de llamadas y configuración está lista para aceptar múltiples credenciales.

### 1.3 Rendimiento

*   **Rendering híbrido**: páginas estáticas cuando conviene (ej. documentación), y SSR para dinámicas (dashboard).
*   **Optimización de imágenes**: con `<Image />` de Next.js.
*   **División de código (code-splitting)**: cada página y componente se carga solo cuando se necesita.

## 2. Principios de Diseño

1.  **Usabilidad**: interfaz limpia, con llamadas claras a la acción. Todos los textos en español y terminología conocida por pequeñas empresas.
2.  **Accesibilidad**: contrastes de color adecuados (ver paleta), roles ARIA donde haga falta, navegación mediante teclado.
3.  **Responsividad**: diseño móvil primero, adaptado a escritorio y tablet. Usamos media queries CSS y unidades relativas (rem, %).
4.  **Coherencia**: patrones de UI (botones, formularios, tarjetas) iguales en todas las páginas.
5.  **Simplicidad**: evitamos sobrecargar al usuario; mostramos funciones solo cuando son necesarias (ej. onboarding visible hasta completarlo).

Estos principios se reflejan en:

*   Formularios con validación clara y mensajes de error.
*   Botones destacados (verde WhatsApp) para acciones principales.
*   Espaciados consistentes entre secciones.

## 3. Styling y Theming

### 3.1 Enfoque de Estilos

*   **CSS Modules** para estilos encapsulados por componente.
*   **CSS global** para variables de colores, tipografía y resets.
*   **Preprocesador**: usamos sintaxis moderna de CSS (PostCSS), sin SASS por ahora.

### 3.2 Theming

*   Definimos variables CSS (`:root`) para colores y espaciados. Así podemos cambiar toda la paleta fácilmente.

*   Lista de variables principales:

    *   `--color-primary: #25D366` (verde WhatsApp)
    *   `--color-background: #FFFFFF` (blanco)
    *   `--color-surface: #F0F0F0` (gris claro)
    *   `--color-text: #333333` (texto principal)

### 3.3 Estilo Visual

*   **Estilo**: diseño moderno y plano (flat design), inspirado en WhatsApp.
*   **Sombras suaves** en tarjetas para jerarquía.
*   **Bordes redondeados** de 4px a 8px.

### 3.4 Tipografía

*   **Fuente principal**: Poppins, peso regular (400) y semibold (600).
*   **Tamaños base**: 16px en `html` (1rem).

## 4. Estructura de Componentes

### 4.1 Organización de Carpetas

`/components # Componentes reutilizables: Button, Card, Modal /hooks # Custom hooks: useAuth, useClients, useMessages /pages # Rutas de Next.js: index.tsx, dashboard.tsx, clients.tsx... /styles # CSS global y variables /utils # Funciones auxiliares: formateo de fecha, validaciones /context # Providers de Context API (Auth, Onboarding)`

### 4.2 Reutilización

*   **Atomic Design ligero**: componentes atómicos (Button), compuestos (Card con header y body) y de página.
*   **Props claras**: cada componente recibe un set de props bien tipado.
*   **Evitar lógica pesada** dentro de los componentes de presentación; se extrae a hooks o funciones utilitarias.

## 5. Gestión de Estado

*   **React Context API**: para estado global ligero como la sesión de usuario y onboarding.
*   **Local state (useState/useReducer)** dentro de cada página o componente para datos específicos.
*   **Realtimé con Supabase**: suscribimos hooks a canales de realtime para métricas y mensajes.
*   **SWR o React Query** (opcional futura): para caching y revalidación automática de datos.

## 6. Enrutamiento y Navegación

*   **Next.js Router**: file-based routing sin configuración extra.

*   **Middleware de protección**: en `middleware.ts` detectamos sesión y redirigimos a `/auth/login` si no hay usuario.

*   **Estructura de rutas**:

    *   `/` → redirige a `/dashboard` o `/auth/login`.
    *   `/auth/login` → inicio de sesión con Google.
    *   `/dashboard`, `/clients`, `/labels`, `/messages`, `/faqs`, `/settings`, `/onboarding`, `/docs`.

*   **Sidebar persistente** en el layout principal para navegar entre secciones.

## 7. Optimización de Rendimiento

1.  **Lazy loading** de componentes menos críticos (ej. modales, tablas pesadas).
2.  **Code splitting** automático de Next.js.
3.  **Optimización de imágenes** con `<Image />` y carga diferida.
4.  **Minificación y compresión** de CSS/JS en Vercel.
5.  **Cache-Control** configurado en headers para assets estáticos.
6.  **Supabase Realtime** para reducir polling y peticiones innecesarias.

## 8. Testing y Aseguramiento de Calidad

### 8.1 Tipos de Pruebas

*   **Unitarias**: Jest + React Testing Library para componentes y hooks.
*   **Integración**: pruebas de flujos (formulario de cliente, CRUD de FAQs) con Testing Library.
*   **End-to-End (E2E)**: Cypress para simular inicio de sesión, creación de cliente y prueba de webhook.

### 8.2 Cobertura y CI

*   **Cobertura mínima**: 80% de líneas.
*   **Integración continua**: en GitHub Actions corre linter, tests y build.
*   **Linting**: ESLint con reglas de Airbnb adaptadas a TypeScript.
*   **Formateo**: Prettier para consistencia de código.

## 9. Conclusión y Resumen

En esta guía hemos repasado cómo está construido el frontend de FácilChat:

*   Usamos **Next.js + TypeScript** para una aplicación escalable y rápida.
*   Seguimos **principios de usabilidad y accesibilidad** con un diseño moderno y plano.
*   Organizamos **componentes** de forma atómica y reutilizable.
*   Gestionamos el estado con **Context API**, hooks y Supabase Realtime.
*   El **routing** se basa en rutas de archivo y un layout común con sidebar.
*   Aplicamos **optimización** en carga de componentes, imágenes y assets.
*   Garantizamos la calidad con **tests unitarios, de integración y E2E**, junto a CI.

Con estas pautas, cualquier desarrollador podrá entender, mantener y escalar el frontend de FácilChat, asegurando una experiencia consistente y de alto rendimiento para nuestros usuarios de pequeñas empresas.
