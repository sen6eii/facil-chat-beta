# FácilChat – Project Requirements Document (PRD)

## 1. Project Overview

FácilChat is an MVP web application that centralizes WhatsApp Business conversations for small and medium-sized businesses (SMBs). Built with simplicity and an intuitive Spanish-language interface, it lets a single “Administrador del negocio” see all incoming and outgoing messages on one dashboard. From here, the user can manage clients, assign labels, send quick auto-replies (FAQs), and track basic customer-service metrics—all without juggling multiple browser tabs or tools.

This tool is being built to save time and reduce confusion for SMB owners who rely on WhatsApp to talk with customers. Key success criteria are:

1.  A seamless Google-based login and onboarding flow.
2.  Reliable connection to WhatsApp via Twilio’s API.
3.  Real-time visibility into new messages, response rates (within 2 hours), and simple client counts.
4.  An extendable, modular codebase (Next.js + Supabase) that’s ready for future add-ons like Instagram DMs or AI agents.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (MVP Features):**

*   Google Sign-In authentication via Supabase Auth.

*   Single user role: “Administrador del negocio.”

*   CRUD for clients: create/edit/archive/delete (archived clients remain in DB).

*   Labels:

    *   Automatic labels (e.g., “Nuevo,” “Última hora,” “Frecuente”).
    *   Manual user-created labels.
    *   CRUD for labels and filtering clients by label.

*   Message storage: incoming/outgoing text messages via Twilio webhooks.

*   Auto-replies (FAQs): question–answer pairs, plus a fallback and customizable welcome message.

*   Dashboard with metrics:

    *   Total clients
    *   Active chats
    *   Response rate in 2 hours (% over last 30 days)
    *   Messages replied today
    *   New clients this month
    *   Recent activity (last 5 messages)

*   Onboarding component: three steps (connect WhatsApp, configure auto-replies, start managing chats), visible until completed or skipped.

*   Real-time updates using Supabase Realtime.

*   Settings page: upload business logo/name, configure global Twilio credentials, view/copy webhook URL.

*   Automatic Markdown documentation generation under `/docs` (routes, schema, components, env vars, deployment).

**Out-of-Scope (Phase 2+):**

*   Multi-user collaboration or roles beyond “Administrador.”
*   E-commerce integration or payments.
*   Handling multimedia (images, audio).
*   Multi-language support beyond Spanish.
*   Built-in AI chatbots (beyond simple FAQs).

## 3. User Flow

1.  **First Access & Login**\
    A user visits the home page (`/`). They see the FácilChat logo, a tagline in Spanish, and an “Iniciar sesión con Google” button. Clicking this triggers Supabase’s Google Sign-In flow. Upon success, the user is recorded as “Administrador del negocio” and redirected to the dashboard. If they’re already authenticated, they auto-land on `/dashboard`.

2.  **Onboarding & Main Dashboard**\
    On `/dashboard`, a three-step onboarding panel guides them to:

    1.  Conectar número de WhatsApp (E.164, +598 for Uruguay)
    2.  Configurar respuestas automáticas (FAQs, fallback, welcome message)
    3.  Comenzar a gestionar chats\
        The user can skip onboarding at any time. Once Twilio webhooks detect an incoming message, the “conexión” step auto-completes and the panel hides. Below this, the dashboard shows metric cards, recent messages, and a sidebar for navigating to Clientes, Etiquetas, Mensajes, FAQs, and Ajustes.

## 4. Core Features

*   **Autenticación**

    *   Google Sign-In (Supabase Auth)
    *   Single role: Administrador del negocio

*   **Gestión de Clientes**

    *   Crear/Editar/Archivar/Borrar clientes
    *   Campos: nombre, teléfono (+598), fecha de creación/actualización, estado
    *   Vista tabla con filtro y búsqueda por etiquetas

*   **Etiquetas**

    *   Automáticas: “Nuevo,” “Respuesta atrasada,” “En curso”
    *   Manuales: creadas por el usuario
    *   CRUD completo y sección de etiquetas archivadas

*   **Mensajes & WhatsApp Flow**

    *   Webhook en `/api/twilio/webhook` guarda mensajes entrantes/salientes
    *   Lista de mensajes sin responder y actividad reciente
    *   Botón “Responder en WhatsApp” abre `https://wa.me/<number>`

*   **Respuestas Automáticas (FAQs)**

    *   CRUD de preguntas y respuestas
    *   Mensaje de fallback configurable
    *   Mensaje de bienvenida configurable
    *   Matching de texto básico y envío via Twilio API

*   **Dashboard de Métricas**

    *   Total de clientes
    *   Chats activos (en tiempo real)
    *   Tasa de respuesta en menos de 2 horas (últimos 30 días)
    *   Mensajes respondidos hoy
    *   Nuevos clientes este mes
    *   Actividad reciente (5 últimos mensajes)

*   **Onboarding**

    *   Componente paso a paso visible en dashboard
    *   Estado de completado en tabla `users` o similar
    *   Opción de omitir

*   **Settings (Ajustes)**

    *   Upload de logo y nombre del negocio
    *   Configurar Twilio Account SID, Auth Token y número (globales)
    *   Mostrar/copiable la URL de webhook

*   **Documentación**

    *   Carpeta `/docs` autogenerada en Markdown con lista de rutas, esquema de BD, componentes y guías de despliegue

## 5. Tech Stack & Tools

*   Frontend

    *   Next.js (React, TypeScript)
    *   Vercel deployment
    *   Poppins font, color palette: verde #25D366, blanco #FFFFFF, gris claro #F0F0F0

*   Backend & Database

    *   Supabase: Auth, Postgres Database, Storage, Realtime
    *   Tables: users, clients, labels, client_labels, messages, faqs

*   Messaging Integration

    *   Twilio WhatsApp API (single global credentials, multi-tenant ready)
    *   Webhook endpoint `/api/twilio/webhook`

*   Authentication

    *   Supabase Auth + Google Sign-In

*   Documentation Tooling

    *   Auto-generation of `/docs` in Markdown

*   IDE & Plugins (optional)

    *   VSCode, with Supabase and Prettier extensions

## 6. Non-Functional Requirements

*   **Performance & Responsiveness**

    *   Dashboard data updates in < 1 segundo tras recibir un nuevo mensaje (Re­altime).
    *   Page load time < 2 segundos en conexiones estándar.

*   **Security & Compliance**

    *   All secrets (Twilio, Supabase) in environment variables, never in client bundle.
    *   HTTPS mandatory (Vercel handles).
    *   GDPR-friendly: only store user email, client phone numbers, and message text.

*   **Usability & Accessibility**

    *   Spanish-only UI with clear, consistent labels (use placeholders UX-friendly: e.g., “Agregar cliente,” “Guardar etiqueta”).
    *   Componentes legibles con contraste suficiente (WCAG AA).

*   **Scalability & Maintainability**

    *   Modular folder structure (by feature).
    *   Well-documented code; auto-generated docs reflect file structure.

## 7. Constraints & Assumptions

*   Single business account, one administrator—no multi-user collaboration yet.
*   All phone numbers are Uruguay-based (E.164, +598).
*   Only text messages; any multimedia directs user to WhatsApp Web.
*   Global Twilio account to serve all businesses in MVP; code should allow future per-business credentials.
*   Auto-label rules (“Última hora,” “Frecuente”) are placeholders; precise definitions to be refined later.
*   Users will supply their own WhatsApp Business number via Twilio and connect webhooks.
*   Supabase free tier limits apply (row counts, realtime subscriptions).

## 8. Known Issues & Potential Pitfalls

*   **Twilio Webhook Reliability:**

    *   Retries or downtime may cause missed messages. Mitigation: log webhook errors, implement retry logic.

*   **Auto-Reply Matching:**

    *   Simple text match may misfire on typos. Future improvement: use fuzzy matching or AI model.

*   **Realtime Scaling:**

    *   Large message volumes could slow Supabase Realtime streams. Plan: batch updates or switch to polling if needed.

*   **E.164 Formatting Errors:**

    *   User-entered numbers may lack correct prefix. Mitigation: validate format on input.

*   **Copy & UX Text:**

    *   Initial text placeholders may need review by Spanish UX writer. Plan for quick A/B tests.

*   **Future Multi-Tenant Support:**

    *   Global Twilio credentials require mapping incoming messages to the right business number. Ensure message payload includes sender number.

This PRD provides all the details needed for an AI or development team to start building the FácilChat MVP with clarity and no missing pieces. Subsequent documents (Tech Stack, Frontend Guidelines, Backend Structure, etc.) can be generated directly from this reference.
