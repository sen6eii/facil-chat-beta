-- Initial schema for FácilChat MVP
-- Created with proper created_at and updated_at columns (no 'timestamp' reserved keyword)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and business admin
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255),
    business_logo_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients table for customer management
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL, -- E.164 format, +598 for Uruguay
    status VARCHAR(50) DEFAULT 'active', -- active, archived
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labels table for categorizing clients
CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#25D366', -- Hex color, default WhatsApp green
    type VARCHAR(20) DEFAULT 'manual', -- automatic, manual
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client labels junction table (many-to-many relationship)
CREATE TABLE client_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, label_id)
);

-- Messages table for WhatsApp communication
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    content TEXT NOT NULL,
    twilio_message_id VARCHAR(100), -- For tracking with Twilio API
    status VARCHAR(20) DEFAULT 'received', -- received, sent, failed, delivered
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQs table for automatic replies
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table for global configuration
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twilio_account_sid TEXT,
    twilio_auth_token TEXT,
    twilio_phone_number VARCHAR(20),
    welcome_message TEXT DEFAULT '¡Hola! Gracias por contactarnos. Te responderemos pronto.',
    fallback_message TEXT DEFAULT 'Lo siento, no entiendo tu pregunta. Un humano te responderá pronto.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (twilio_account_sid, twilio_auth_token, twilio_phone_number) 
VALUES (NULL, NULL, NULL);

-- Indexes for performance
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_messages_client_id ON messages(client_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_client_labels_client_id ON client_labels(client_id);
CREATE INDEX idx_client_labels_label_id ON client_labels(label_id);
CREATE INDEX idx_labels_type ON labels(type);
CREATE INDEX idx_labels_archived ON labels(is_archived);

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_labels_updated_at BEFORE UPDATE ON labels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified for single admin)
-- For MVP, we'll use a single admin approach - these policies can be expanded for multi-tenant later

-- Users can only see their own record
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- Clients management
CREATE POLICY "Full access to clients" ON clients FOR ALL USING (true);

-- Labels management
CREATE POLICY "Full access to labels" ON labels FOR ALL USING (true);

-- Client labels junction
CREATE POLICY "Full access to client labels" ON client_labels FOR ALL USING (true);

-- Messages management
CREATE POLICY "Full access to messages" ON messages FOR ALL USING (true);

-- FAQs management
CREATE POLICY "Full access to faqs" ON faqs FOR ALL USING (true);

-- Settings management (single admin)
CREATE POLICY "Full access to settings" ON settings FOR ALL USING (true);