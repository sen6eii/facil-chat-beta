-- FácilChat Row Level Security (RLS) Policies
-- Migration: 002_rls_policies.sql

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reply_settings ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only see and update their own record
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own record (for new sign-ups)
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients table policies
-- Users can only see their own clients
CREATE POLICY "Users can view own clients" ON clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients
    FOR DELETE USING (auth.uid() = user_id);

-- Labels table policies
-- Users can only see their own labels
CREATE POLICY "Users can view own labels" ON labels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labels" ON labels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labels" ON labels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels" ON labels
    FOR DELETE USING (auth.uid() = user_id);

-- Client labels junction table policies
-- Users can only see labels for their own clients
CREATE POLICY "Users can view own client labels" ON client_labels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_labels.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own client labels" ON client_labels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_labels.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own client labels" ON client_labels
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_labels.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Messages table policies
-- Users can only see their own messages
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

-- FAQs table policies
-- Users can only see their own FAQs
CREATE POLICY "Users can view own faqs" ON faqs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own faqs" ON faqs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own faqs" ON faqs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own faqs" ON faqs
    FOR DELETE USING (auth.uid() = user_id);

-- Auto-reply settings policies
-- Users can only see their own settings
CREATE POLICY "Users can view own auto_reply_settings" ON auto_reply_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auto_reply_settings" ON auto_reply_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto_reply_settings" ON auto_reply_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own auto_reply_settings" ON auto_reply_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Function to handle user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create view for dashboard metrics (secured by RLS)
CREATE OR REPLACE VIEW user_dashboard_metrics AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_clients,
    COUNT(DISTINCT CASE WHEN c.last_message_at >= now() - interval '30 days' THEN c.id END) as clients_last_30_days,
    COUNT(m.id) as total_messages,
    COUNT(CASE WHEN m.direction = 'in' THEN m.id END) as incoming_messages,
    COUNT(CASE WHEN m.direction = 'out' THEN m.id END) as outgoing_messages,
    COUNT(CASE 
        WHEN m.direction = 'in' AND 
        EXISTS (
            SELECT 1 FROM messages m2 
            WHERE m2.client_id = m.client_id 
            AND m2.direction = 'out' 
            AND m2.timestamp > m.timestamp 
            AND m2.timestamp <= m.timestamp + interval '2 hours'
        ) 
        THEN m.id 
    END) as messages_replied_within_2h,
    COUNT(CASE WHEN DATE(m.timestamp) = CURRENT_DATE THEN m.id END) as messages_today,
    COUNT(CASE WHEN m.timestamp >= now() - interval '24 hours' THEN m.id END) as messages_last_24h,
    COUNT(CASE WHEN c.created_at >= now() - interval '30 days' THEN c.id END) as new_clients_30_days
FROM users u
LEFT JOIN clients c ON u.id = c.user_id
LEFT JOIN messages m ON u.id = m.user_id
GROUP BY u.id;

-- Enable RLS on the view
ALTER VIEW user_dashboard_metrics SET (security_barrier = true);

-- Policy for the metrics view
CREATE POLICY "Users can view own dashboard metrics" ON user_dashboard_metrics
    FOR SELECT USING (auth.uid() = user_id);

-- Function to get recent messages for a user
CREATE OR REPLACE FUNCTION get_user_recent_messages(p_user_id uuid, p_limit int DEFAULT 5)
RETURNS TABLE (
    id uuid,
    client_id uuid,
    client_name text,
    client_phone text,
    content text,
    direction text,
    timestamp timestamp with time zone,
    twilio_message_id text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.client_id,
        c.name as client_name,
        c.phone as client_phone,
        m.content,
        m.direction,
        m.timestamp,
        m.twilio_message_id
    FROM messages m
    JOIN clients c ON m.client_id = c.id
    WHERE m.user_id = p_user_id
    ORDER BY m.timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;