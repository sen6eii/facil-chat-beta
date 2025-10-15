# FácilChat - WhatsApp Business Management

Una aplicación web para centralizar y gestionar conversaciones de WhatsApp Business para pequeñas y medianas empresas.

## 🚀 Características

- **Gestión de Clientes**: CRUD completo de clientes con etiquetas automáticas y manuales
- **Mensajes en Tiempo Real**: Conversaciones organizadas con actualizaciones en vivo
- **Respuestas Automáticas**: Sistema de FAQs con coincidencia inteligente
- **Dashboard Analytics**: Métricas clave de rendimiento
- **Integración Twilio**: Webhook seguro para recibir mensajes de WhatsApp
- **Base de Datos Segura**: Supabase con Row Level Security (RLS)
- **Interfaz en Español**: Diseño intuitivo y profesional

## 🛠 Stack Tecnológico

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime), Next.js API Routes
- **Integración**: Twilio WhatsApp API
- **Autenticación**: Google Sign-In via Supabase Auth
- **Despliegue**: Vercel

## 📋 Instalación

1. Clona el repositorio:
```bash
git clone <repository-url>
cd facil-chat-beta
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Twilio
TWILIO_ACCOUNT_SID=tu_twilio_account_sid
TWILIO_AUTH_TOKEN=tu_twilio_auth_token
TWILIO_PHONE_NUMBER=tu_twilio_phone_number

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secreto
```

## 🗄️ Configuración de la Base de Datos

1. Crea un proyecto en Supabase
2. Ejecuta las migraciones SQL desde `supabase/migrations/`
3. Habilita Google Auth en la configuración de Supabase

Las migraciones crearán automáticamente:
- Tablas para usuarios, clientes, mensajes, etiquetas, FAQs
- Row Level Security (RLS) para proteger datos
- Triggers para timestamps y actualizaciones automáticas
- Funciones para métricas y consultas complejas

## 📱 Configuración de Twilio

1. Crea una cuenta en Twilio
2. Configura el Sandbox de WhatsApp
3. Configura el webhook en tu cuenta de Twilio:
   - URL: `https://tu-dominio.vercel.app/api/twilio/webhook`
   - Método: POST

## 🚀 Ejecutar el Proyecto

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📊 Estructura del Proyecto

```
src/
├── app/                 # App Router de Next.js
│   ├── api/            # Rutas API
│   ├── dashboard/      # Dashboard principal
│   ├── clients/        # Gestión de clientes
│   ├── messages/       # Conversaciones
│   ├── faqs/          # Preguntas frecuentes
│   ├── labels/        # Gestión de etiquetas
│   └── settings/      # Configuración
├── components/
│   ├── ui/            # Componentes reutilizables
│   ├── clients/       # Componentes de clientes
│   ├── messages/      # Componentes de mensajes
│   ├── faqs/          # Componentes de FAQs
│   └── layout/        # Componentes de layout
├── lib/
│   ├── services/      # Servicios de negocio
│   ├── twilio/        # Utilidades de Twilio
│   └── supabase.ts    # Cliente de Supabase
└── types/
    └── database.ts    # Tipos de la base de datos
```

## 🔧 Funcionalidades Principales

### Gestión de Clientes
- Crear, editar, archivar clientes
- Validación de números uruguayos (+598)
- Etiquetas automáticas: Nuevo, Última hora, Frecuente, Respuesta atrasada
- Búsqueda y filtrado por etiquetas

### Sistema de Mensajes
- Conversaciones organizadas por cliente
- Actualizaciones en tiempo real con Supabase Realtime
- Botón "Responder en WhatsApp" que abre wa.me
- Historial completo de conversaciones

### Respuestas Automáticas
- Sistema de FAQs con coincidencia inteligente
- Puntuación por coincidencia exacta, parcial y por keywords
- Mensajes de bienvenida y por defecto configurables
- Activación/desactivación general del sistema

### Dashboard
- Métricas en tiempo real
- Total de clientes, chats activos
- Tasa de respuesta (últimos 30 días)
- Actividad reciente

## 🔒 Seguridad

- Row Level Security (RLS) en todas las tablas
- Validación de webhooks de Twilio con firma HMAC
- Variables de entorno para credenciales
- Autenticación via Google OAuth

## 🌐 Despliegue

El proyecto está configurado para desplegarse en Vercel automáticamente:

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Despliega automáticamente en cada push a main

## 📄 Licencia

Este proyecto es propiedad de FácilChat y está bajo licencia privada.

## 🆘 Soporte

Para problemas técnicos o preguntas:
- Revisa la configuración de variables de entorno
- Verifica las credenciales de Supabase y Twilio
- Consulta los logs de la aplicación y los servicios externos