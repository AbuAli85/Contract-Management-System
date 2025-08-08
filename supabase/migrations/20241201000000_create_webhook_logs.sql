-- Create webhook_logs table for tracking webhook dispatches
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  payload jsonb NOT NULL,
  error text,
  attempts int NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_type ON webhook_logs(type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_error ON webhook_logs(error) WHERE error IS NOT NULL;

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_logs
DROP POLICY IF EXISTS "Admins can view all webhook logs" ON webhook_logs;
DROP POLICY IF EXISTS "System can insert webhook logs" ON webhook_logs;

CREATE POLICY "Admins can view all webhook logs" ON webhook_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "System can insert webhook logs" ON webhook_logs
  FOR INSERT WITH CHECK (true); 