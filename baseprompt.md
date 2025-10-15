Build an MVP web app called "FácilChat", designed to help small and medium businesses manage and organize their WhatsApp Business conversations in one place. 
The app must be simple, intuitive, and focused on helping SMBs centralize their chats, configure automatic replies, track client interactions, and monitor basic metrics. 
All UI and text must be in Spanish. 

FácilChat = más ventas, menos estrés.

---

OBJECTIVES
- Allow users to centralize their WhatsApp chats in one dashboard.
- Provide an easy onboarding flow to configure auto-replies and client management.
- Automate FAQ responses to save time.
- Show simple numeric metrics to help small businesses improve customer service.
- Build a maintainable, modular, and scalable MVP ready for future integrations (AI agents, Instagram DMs, routing logic).

---

STACK & DEPLOYMENT
- Frontend: **Next.js (React)** deployed to **Vercel**.
- Backend: **Supabase** (Authentication, Database, Storage, Realtime).
- Authentication: Google Sign-In (any Gmail, no domain restriction).
- WhatsApp Integration: **Twilio WhatsApp API** (set up endpoints for future commercial number connection).
- Language: All UI and text in **Spanish**.
- Design: Clean, inspired by WhatsApp (green/white/light gray), **Poppins** font.
- Documentation: Automatically generate Markdown files under `/docs` with routes, components, variables, and deployment instructions.

---

FUNCTIONALITY OVERVIEW (MVP)

1. Authentication  
   - Google Sign-In via Supabase Auth.  
   - Single user role: “Administrador del negocio”.  

2. Clients  
   - CRUD operations (create, edit, archive, delete).  
   - Archive hides from active list but keeps in DB.  
   - Display client name, phone, last message, assigned labels, and activity status.  

3. Labels  
   - Two types: automatic (Nuevo, Última hora, Frecuente) and manual (created by user).  
   - CRUD: create, edit, delete.  
   - Inactive labels (without clients) are shown as “archived”.  
   - Filter and search clients by labels.

4. Messages & WhatsApp Flow  
   - Store incoming/outgoing messages (via Twilio webhooks).  
   - Show unreplied messages and recent activity in dashboard.  
   - For full view or reply → redirect to WhatsApp Web for that client number.  

5. Auto-Responses & FAQs  
   - User can configure FAQs (question → answer).  
   - On incoming message, match text with FAQ; if found, send automatic reply via Twilio.  
   - If not matched, send fallback message:  
     “Gracias por escribirnos, pronto un agente te responderá.”  
   - Configurable welcome message for new clients.  

6. Dashboard (numeric metrics only)  
   - Total clients.  
   - Active chats (real-time).  
   - Response rate (%).  
   - Messages replied today.  
   - New clients this month.  
   - Recent activity (last 5 messages or clients contacted).  

7. Onboarding  
   - Visible component (not modal) inside the dashboard guiding the user through 3 steps:  
     1. Conectar número de WhatsApp  
     2. Configurar respuestas automáticas  
     3. Comenzar a gestionar chats  

8. Realtime Updates  
   - Use Supabase Realtime for metrics and message changes.  

9. Exclusions  
   - No CRM, no e-commerce, no AI chatbot, no payments, no mobile app, no multi-language.  

---

DATABASE SCHEMA (Supabase)
- users: id, email, name, created_at  
- clients: id, name, phone, status (active/archived), created_at, updated_at  
- labels: id, name, type (auto/manual), active (boolean), created_at  
- client_labels: client_id, label_id  
- messages: id, client_id, content, direction (in/out), timestamp, twilio_message_id  
- faqs: id, question, answer, created_at  

---

PAGES & ROUTES (Next.js recommended structure)

1. **/**  
   - Path: `/`  
   - Description: Landing or redirect page. If user is authenticated, redirect to `/dashboard`.  
   - Elements: Logo FácilChat, short tagline, “Iniciar sesión con Google” button.  

2. **/auth/login**  
   - Path: `/auth/login`  
   - Description: Login page with Google Sign-In button.  
   - Components: Authentication card, Supabase integration.  
   - Behavior: If logged in → redirect to `/dashboard`.  

3. **/dashboard**  
   - Path: `/dashboard`  
   - Description: Main overview page showing metrics and recent activity.  
   - Components:  
     - Metric cards (Clientes totales, Chats activos, Tasa de respuesta, etc.)  
     - “Actividad reciente” section (últimos mensajes).  
     - Embedded onboarding component (visible if onboarding incomplete).  

4. **/clients**  
   - Path: `/clients`  
   - Description: List of clients.  
   - Features:  
     - Create/edit/delete client modal.  
     - Assign/remove labels.  
     - Filter/search by label.  
     - Archive client button.  
   - Components: ClientTable, FilterBar, ArchiveToggle.  

5. **/labels**  
   - Path: `/labels`  
   - Description: Manage labels.  
   - Features:  
     - List active and archived labels.  
     - Create/edit/delete labels.  
     - Mark inactive if no clients associated.  
   - Components: LabelList, LabelForm.  

6. **/messages**  
   - Path: `/messages`  
   - Description: View unreplied and recent messages.  
   - Features:  
     - List incoming messages.  
     - Show snippet of latest messages.  
     - Button “Responder en WhatsApp” → open chat on WhatsApp Web.  
   - Components: MessageTable, WhatsAppRedirectButton.  

7. **/faqs**  
   - Path: `/faqs`  
   - Description: Manage FAQ auto-replies.  
   - Features: CRUD of FAQs, preview of fallback message, set welcome message.  
   - Components: FaqTable, FaqForm.  

8. **/settings**  
   - Path: `/settings`  
   - Description: Business settings.  
   - Features: Configure WhatsApp number (Twilio endpoint), set fallback and welcome message.  
   - Components: SettingsForm, ApiKeyInput, WebhookURLDisplay.  

9. **/onboarding**  
   - Path: `/onboarding`  
   - Description: Standalone view of onboarding steps for first-time setup.  
   - Components: Stepper (3 steps: connect WhatsApp, set auto-replies, start chats).  
   - Completion stored in user table.  

10. **/docs (auto-generated)**  
   - Path: `/docs` (not public, repository folder only).  
   - Description: Markdown documentation generated automatically by Lovable.  
   - Includes: routes, database schema, components, environment variables, deployment guide.  

---

FUNCTIONAL BEHAVIOR RULES
- Incoming messages via Twilio webhook are stored in `messages`.  
- Attempt to match text with `faqs`; if match → send automatic reply, else fallback.  
- Update metrics and client “last activity” in real time.  
- Unreplied messages = inbound without outbound reply → appear in `/messages`.  
- Labels update dynamically; inactive if no associated clients.  
- Dashboard metrics auto-refresh using Supabase subscriptions.  

---

STEPS TO DEVELOP (Follow strictly)

1. **Project Initialization**
   - Create Next.js repo (TypeScript).  
   - Configure Supabase project and connect environment variables.  
   - Implement Google Auth (Supabase).  

2. **Database Setup**
   - Create tables: users, clients, labels, client_labels, messages, faqs.  
   - Define relationships and constraints.  
   - Seed test data for development.  

3. **Frontend Scaffolding**
   - Implement `/auth/login` with Google Sign-In.  
   - Setup protected route middleware.  
   - Create app layout with sidebar (Dashboard, Clients, Labels, Messages, FAQs, Settings).  

4. **Dashboard Page**
   - Implement metric cards (static → dynamic with Supabase).  
   - Add “Recent Activity” list and onboarding component.  

5. **Clients Page**
   - CRUD for clients.  
   - Filtering by labels.  
   - Archive functionality.  

6. **Labels Page**
   - CRUD for labels.  
   - Display inactive labels separately.  
   - Update clients dynamically when label changes.  

7. **Messages Page**
   - Implement message list (unreplied + latest).  
   - Add redirect to WhatsApp Web for reply.  
   - Connect to Supabase messages table.  

8. **Twilio Integration**
   - Create webhook endpoint `/api/twilio/webhook` to receive messages.  
   - Store messages in DB and trigger FAQ auto-reply if matched.  
   - Include environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER.  

9. **Auto-Responses (FAQs)**
   - CRUD for FAQs.  
   - Implement message matching and reply via Twilio API.  
   - Add editable fallback and welcome messages in `/settings`.  

10. **Realtime Updates**
    - Use Supabase Realtime for message counts and metrics.  
    - Auto-refresh dashboard when new message arrives.  

11. **Onboarding Component**
    - Add visible stepper inside dashboard + separate `/onboarding` route.  
    - Track completion state in user profile.  

12. **Testing & QA**
    - Validate flows (login → onboarding → send/receive message → dashboard update).  
    - Test archiving and filtering logic.  

13. **Deployment**
    - Deploy frontend on Vercel.  
    - Connect Supabase production instance.  
    - Set environment variables properly.  

14. **Documentation**
    - Generate `/docs` folder with Markdown including:  
      - Routes list  
      - DB schema  
      - Components and props  
      - Environment variables  
      - Deployment instructions  

15. **Feedback Phase**
    - Test with 5 pilot users.  
    - Gather insights and prepare backlog for Beta.

---

DELIVERABLES
- Fully functional web app deployed on Vercel.  
- Connected to Supabase backend.  
- Working Twilio webhook integration.  
- Clean Spanish UI using Poppins.  
- `/docs` folder auto-generated with full documentation.  

---

QA CRITERIA
- User can log in with Google and see dashboard.  
- Metrics update dynamically after first message.  
- Messages received via Twilio stored in DB.  
- FAQ auto-reply fires correctly.  
- Client CRUD and labels work.  
- Onboarding visible until setup completed.  
- Redirect to WhatsApp Web opens correct chat.  

---

NOTES
- Keep code modular and commented.  
- Prepare for future migration from Twilio to 360dialog or Meta Cloud API.  
- All text in Spanish.  
- Interface name: “FácilChat”.  
