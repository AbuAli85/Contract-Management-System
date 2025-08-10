-- Composite indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_status_created_at ON bookings (status, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id_created_at ON bookings (provider_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id_created_at ON bookings (client_id, created_at);

-- Composite indexes for services
CREATE INDEX IF NOT EXISTS idx_services_status_created_at ON services (status, created_at);
CREATE INDEX IF NOT EXISTS idx_services_provider_id_created_at ON services (provider_id, created_at);
CREATE INDEX IF NOT EXISTS idx_services_client_id_created_at ON services (client_id, created_at);

-- Composite indexes for contracts
CREATE INDEX IF NOT EXISTS idx_contracts_status_created_at ON contracts (status, created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_provider_id_created_at ON contracts (provider_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id_created_at ON contracts (client_id, created_at);