flowchart TD
  A[Pagina Inicio] --> B[Autenticacion con Google]
  B --> C[Dashboard]
  C --> D[Clientes]
  C --> E[Etiquetas]
  C --> F[Mensajes]
  C --> G[FAQs]
  C --> H[Ajustes]
  C --> I[Onboarding]
  I --> C
  subgraph Webhook Twilio
    J[Webhook Twilio] --> K[Almacenar Mensaje]
  end
  K --> L{Coincide con FAQ}
  L -->|Si| M[Enviar Respuesta Automatica]
  L -->|No| N[Enviar Mensaje de Fallback]
  M --> O[Actualizar Realtime]
  N --> O
  O --> C
  O --> F