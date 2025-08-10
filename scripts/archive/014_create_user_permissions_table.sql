CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(64) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (user_id, permission)
); 