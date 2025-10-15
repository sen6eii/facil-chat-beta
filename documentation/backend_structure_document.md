# Backend Structure Document

## 1. Backend Architecture

This project uses a mix of managed services and lightweight custom logic to keep things simple, scalable, and easy to maintain.

- Core backend powered by Supabase, which provides:
  - PostgreSQL database for structured data
  - Authentication (Google Sign-In) out of the box
  - Real-time subscriptions to push updates instantly
  - Secure storage for assets (if needed in the future)
- Custom serverless functions in Next.js (hosted on Vercel) handle special workflows, notably the Twilio webhook for incoming WhatsApp messages.
- Event-driven design for message handling:
  - Incoming WhatsApp messages arrive via Twilio webhooks into a Next.js API route
  - Messages get stored in the database and trigger auto-replies or fallback replies
  - Supabase Realtime pushes updates to the frontend without manual polling

How it supports key goals:
- Scalability: Supabase and Vercel auto-scale behind the scenes, handling gradual or sudden traffic changes without manual intervention.
- Maintainability: Most logic lives in isolated serverless functions or declarative database rules, making updates quick and low-risk.
- Performance: Real-time subscriptions and edge-distributed hosting ensure low latency for users in any location.

## 2. Database Management

All data lives in a PostgreSQL instance managed by Supabase. Here’s how we handle it:

- Database type: Relational (SQL - PostgreSQL)
- Connection: Frontend uses the Supabase JavaScript client to read/write data directly, respecting row-level security (RLS) policies.
- Real-time: Built-in websockets allow the frontend to subscribe to changes on key tables (messages, clients, metrics).
- Backups & durability: Supabase takes daily snapshots and replicates data across zones for high availability.

Data handling practices:
- Soft-delete/archive instead of hard delete (e.g., `status` field on clients).
- Timestamps (`created_at`, `updated_at`) on all main tables for auditing and metrics.
- Junction table (`client_labels`) for many-to-many between clients and labels.
- Indexes on foreign keys and fields used in filters (e.g., `client_id`, `direction`, `timestamp`).

## 3. Database Schema

**Human-readable overview**

- **users**: Business administrators (one per business for MVP)
  - id (unique)
  - email
  - name
  - onboarding_complete (boolean)
  - created_at

- **clients**: Contacts the business chats with
  - id
  - name
  - phone (E.164 format)
  - status (active / archived)
  - created_at, updated_at

- **labels**: Tags for clients
  - id
  - name
  - type (auto / manual)
  - active (boolean)
  - created_at

- **client_labels**: Links clients and labels
  - client_id
  - label_id

- **messages**: All inbound/outbound WhatsApp texts
  - id
  - client_id
  - content
  - direction (in / out)
  - timestamp
  - twilio_message_id

- **faqs**: Auto-reply rules
  - id
  - question (match pattern)
  - answer (text)
  - created_at

**SQL schema (PostgreSQL)**

```sql
-- users
CREATE TABLE users (
  id             uuid PRIMARY KEY,
  email          text UNIQUE NOT NULL,
  name           text,
  onboarding_complete boolean DEFAULT false,
  created_at     timestamp with time zone DEFAULT now()
);

-- clients
CREATE TABLE clients (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  phone       text UNIQUE NOT NULL,
  status      text CHECK (status IN ('active','archived')) DEFAULT 'active',
  created_at  timestamp with time zone DEFAULT now(),
  updated_at  timestamp with time zone DEFAULT now()
);

-- labels
CREATE TABLE labels (
  id          uuid PRIMARY KEY,
  name        text NOT NULL,
  type        text CHECK (type IN ('auto','manual')) NOT NULL,
  active      boolean DEFAULT true,
  created_at  timestamp with time zone DEFAULT now()
);

-- client_labels
CREATE TABLE client_labels (
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  label_id    uuid REFERENCES labels(id)   ON DELETE CASCADE,
  PRIMARY KEY (client_id, label_id)
);

-- messages
CREATE TABLE messages (
  id                uuid PRIMARY KEY,
  client_id         uuid REFERENCES clients(id),
  content           text NOT NULL,
  direction         text CHECK (direction IN ('in','out')) NOT NULL,
  timestamp         timestamp with time zone NOT NULL,
  twilio_message_id text UNIQUE
);

-- faqs
CREATE TABLE faqs (
  id          uuid PRIMARY KEY,
  question    text NOT NULL,
  answer      text NOT NULL,
  created_at  timestamp with time zone DEFAULT now()
);
```  

## 4. API Design and Endpoints

### Supabase-Powered CRUD
- The frontend leverages Supabase’s auto-generated REST and realtime endpoints for:
  - User profile and onboarding status
  - Clients (list, create, update, archive)
  - Labels and client-label assignments
  - FAQs (auto-reply rules)
  - Messages (read only in UI; writes happen via Twilio webhook or FAQs logic)

Row-Level Security ensures each user only sees their own data.

### Custom Twilio Webhook
- **Endpoint**: POST `/api/twilio/webhook`
- **Purpose**: Receive incoming WhatsApp messages from Twilio
- **Workflow**:
  1. Twilio sends message data (from, to, body) to our webhook
  2. We verify the Twilio signature for security
  3. Store the inbound message in `messages` table
  4. Check FAQs for a match and send an auto-reply via Twilio API, or send fallback message
  5. Store outbound auto-reply in `messages` table
  6. Supabase Realtime pushes updates to the dashboard

### Future Custom Endpoints (planned)
- Multi-tenant onboarding of additional WhatsApp numbers
- Manual message send from dashboard (if we migrate away from direct WhatsApp Web redirects)

## 5. Hosting Solutions

- **Vercel**
  - Hosts Next.js frontend and serverless API routes in edge-distributed regions
  - Zero-configuration SSL, automatic scaling, global CDN
- **Supabase Cloud**
  - Managed PostgreSQL with built-in Auth, Realtime, Storage
  - Automatic backups, high availability
- **Twilio Cloud**
  - WhatsApp messaging platform via REST API and webhooks

Benefits:
- Highly reliable and monitored managed services
- Pay-as-you-grow pricing keeps costs low in MVP phase
- No servers to patch or maintain

## 6. Infrastructure Components

- **Global CDN**: Vercel serves static assets and Next.js pages from edge locations
- **Load Balancer**: Vercel’s infrastructure automatically balances traffic across multiple instances
- **Caching**: 
  - Edge caching for static assets and public pages
  - Browser caching headers for improved load times
- **Websockets**: Supabase Realtime uses websockets for instant updates
- **Database cluster**: Supabase handles replication and failover, distributing read/write load

Together, these pieces ensure the app feels instant, even as usage grows.

## 7. Security Measures

- **Authentication**: 
  - Supabase Auth with Google Sign-In (OAuth 2.0)
  - No domain restriction—any Gmail account allowed for MVP
- **Authorization**:
  - Row-Level Security (RLS) policies on every table, ensuring users only see and edit their own data
- **Data Encryption**:
  - SSL/TLS in transit for all connections (frontend ↔ Supabase, Twilio webhook)
  - Encryption at rest in Supabase Postgres
- **Webhook Security**:
  - Validate Twilio’s signature header on each incoming request
- **Environment Variables**:
  - All secrets (Supabase keys, Twilio credentials) stored securely in Vercel and Supabase environments

These measures protect user data and prepare us for any GDPR or local data-protection requirements.

## 8. Monitoring and Maintenance

- **Logs & Metrics**:
  - Vercel dashboard for serverless function logs, latency, and error rates
  - Supabase analytics for database performance, query times, and connection statistics
  - Twilio console logs for message delivery status
- **Alerts** (future):
  - Integrate with email or Slack notifications for errors above a threshold
- **Backups & Updates**:
  - Supabase daily snapshots with point-in-time recovery
  - Regular review of dependency versions in Next.js and serverless code
- **Maintenance Windows**:
  - Supabase handles infrastructure updates automatically
  - We plan minor maintenance deploys during off-peak hours (early mornings)

## 9. Conclusion and Overall Backend Summary

FácilChat’s backend is built on modern, managed services to minimize overhead and maximize reliability. Key takeaways:
- Supabase handles most of our heavy lifting: database, auth, real-time updates, and storage.
- Next.js serverless functions cover custom logic (WhatsApp webhooks) without running servers.
- Vercel’s global edge network and Supabase’s managed Postgres deliver performance and scalability from day one.
- Security is baked in via row-level policies, OAuth, SSL, and webhook validation.

This setup meets the MVP’s goals—centralized WhatsApp management, real-time updates, easy onboarding—while laying the groundwork for multi-tenant growth and advanced features in future iterations.