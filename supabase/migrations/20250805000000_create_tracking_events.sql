CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ DEFAULT now(),
  actor_user_id UUID REFERENCES profiles(id),
  subject_type TEXT CHECK (char_length(subject_type) > 0),
  subject_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  idempotency_key TEXT UNIQUE
);

ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all tracking events"
ON tracking_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Users can view their own tracking events"
ON tracking_events
FOR SELECT
USING (actor_user_id = auth.uid());

CREATE POLICY "Authenticated can insert tracking events"
ON tracking_events
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update tracking events"
ON tracking_events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins can delete tracking events"
ON tracking_events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);