-- FácilChat Database Schema
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - Business administrators
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  name text,
  business_name text,
  business_logo_url text,
  onboarding_complete boolean DEFAULT false,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_phone_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Clients table - Customer information
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  status text CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  last_message_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Labels table - Tags for clients
CREATE TABLE labels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text CHECK (type IN ('auto', 'manual')) NOT NULL,
  color text DEFAULT '#25D366',
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Client labels junction table - Many-to-many relationship
CREATE TABLE client_labels (
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  label_id uuid REFERENCES labels(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (client_id, label_id)
);

-- Messages table - All inbound/outbound WhatsApp messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  direction text CHECK (direction IN ('in', 'out')) NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  twilio_message_id text UNIQUE,
  status text DEFAULT 'delivered',
  created_at timestamp with time zone DEFAULT now()
);

-- FAQs table - Auto-reply configurations
CREATE TABLE faqs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[],
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Auto-reply settings
CREATE TABLE auto_reply_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  welcome_message text,
  fallback_message text,
  auto_reply_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_last_message ON clients(last_message_at DESC);

CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_direction ON messages(direction);

CREATE INDEX idx_labels_user_id ON labels(user_id);
CREATE INDEX idx_labels_type ON labels(type);
CREATE INDEX idx_labels_active ON labels(active);

CREATE INDEX idx_client_labels_client_id ON client_labels(client_id);
CREATE INDEX idx_client_labels_label_id ON client_labels(label_id);

CREATE INDEX idx_faqs_user_id ON faqs(user_id);
CREATE INDEX idx_faqs_active ON faqs(active);

CREATE INDEX idx_auto_reply_settings_user_id ON auto_reply_settings(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_reply_settings_updated_at BEFORE UPDATE ON auto_reply_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update client's last_message_at when a new message is received
CREATE OR REPLACE FUNCTION update_client_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients 
    SET last_message_at = NEW.timestamp 
    WHERE id = NEW.client_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update client last message timestamp
CREATE TRIGGER update_client_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_client_last_message();

-- Function to create default auto-reply settings for new users
CREATE OR REPLACE FUNCTION create_default_auto_reply_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auto_reply_settings (user_id, welcome_message, fallback_message)
    VALUES (
        NEW.id,
        '¡Hola! Gracias por contactarnos. Te responderemos pronto.',
        'Gracias por tu mensaje. Nuestro equipo te responderá a la brevedad.'
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default auto-reply settings
CREATE TRIGGER create_default_auto_reply_settings_trigger
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_auto_reply_settings();

-- Function to create default labels for new users
CREATE OR REPLACE FUNCTION create_default_labels()
RETURNS TRIGGER AS $$
BEGIN
    -- Create automatic labels
    INSERT INTO labels (user_id, name, type, color)
    VALUES 
        (NEW.id, 'Nuevo', 'auto', '#25D366'),
        (NEW.id, 'Última hora', 'auto', '#FF6B6B'),
        (NEW.id, 'Frecuente', 'auto', '#4ECDC4');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create default labels
CREATE TRIGGER create_default_labels_trigger
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_default_labels();