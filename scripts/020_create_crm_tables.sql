-- Promoter Communications
CREATE TABLE IF NOT EXISTS promoter_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- call, email, meeting, sms, whatsapp, etc.
    subject TEXT,
    description TEXT,
    communication_time TIMESTAMPTZ NOT NULL,
    participants JSONB, -- [{name, email, role}]
    outcome TEXT, -- completed, scheduled, follow-up needed
    status TEXT DEFAULT 'completed',
    attachments JSONB, -- [{file_url, file_name}]
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promoter Tasks
CREATE TABLE IF NOT EXISTS promoter_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, overdue
    priority TEXT DEFAULT 'medium', -- low, medium, high
    assigned_to UUID REFERENCES profiles(id),
    related_communication UUID REFERENCES promoter_communications(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promoter Notes
CREATE TABLE IF NOT EXISTS promoter_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    note_time TIMESTAMPTZ DEFAULT NOW(),
    author UUID REFERENCES profiles(id),
    related_communication UUID REFERENCES promoter_communications(id),
    related_task UUID REFERENCES promoter_tasks(id),
    visibility TEXT DEFAULT 'team', -- private, team, admin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communications_promoter ON promoter_communications(promoter_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON promoter_communications(type);
CREATE INDEX IF NOT EXISTS idx_communications_time ON promoter_communications(communication_time);
CREATE INDEX IF NOT EXISTS idx_tasks_promoter ON promoter_tasks(promoter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON promoter_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON promoter_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_notes_promoter ON promoter_notes(promoter_id);
CREATE INDEX IF NOT EXISTS idx_notes_author ON promoter_notes(author);

-- RLS Policies
ALTER TABLE promoter_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_notes ENABLE ROW LEVEL SECURITY;

-- Communications policies
CREATE POLICY "Users can view their own and team communications" ON promoter_communications
    FOR SELECT USING (
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
    );
CREATE POLICY "Admins can manage all communications" ON promoter_communications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Tasks policies
CREATE POLICY "Users can view their own and assigned tasks" ON promoter_tasks
    FOR SELECT USING (
        auth.uid() = created_by OR auth.uid() = assigned_to OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
    );
CREATE POLICY "Admins can manage all tasks" ON promoter_tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Notes policies
CREATE POLICY "Users can view their own and team notes" ON promoter_notes
    FOR SELECT USING (
        visibility IN ('team', 'admin') OR author = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );
CREATE POLICY "Admins can manage all notes" ON promoter_notes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    ); 