-- Seed basic data

-- Sample admin
INSERT INTO profiles (id, role, full_name, email) 
VALUES (gen_random_uuid(), 'admin', 'Admin User', 'admin@example.com');

-- Sample client
INSERT INTO profiles (id, role, full_name, email) 
VALUES (gen_random_uuid(), 'client', 'Client User', 'client@example.com');

-- Sample provider
INSERT INTO profiles (id, role, full_name, email) 
VALUES (gen_random_uuid(), 'provider', 'Provider User', 'provider@example.com');

-- Get IDs
DO $$
DECLARE
  client_id UUID;
  provider_id UUID;
  service1_id UUID;
BEGIN
  SELECT id INTO client_id FROM profiles WHERE email = 'client@example.com';
  SELECT id INTO provider_id FROM profiles WHERE email = 'provider@example.com';

  -- 2 services
  INSERT INTO services (id, provider_id, name, price_base, duration_minutes) 
  VALUES (gen_random_uuid(), provider_id, 'Service 1', 100, 60) RETURNING id INTO service1_id;

  INSERT INTO services (id, provider_id, name, price_base, duration_minutes) 
  VALUES (gen_random_uuid(), provider_id, 'Service 2', 150, 90);

  -- 1 booking
  INSERT INTO bookings (id, client_id, provider_id, service_id, status, scheduled_start, total_price, currency) 
  VALUES (gen_random_uuid(), client_id, provider_id, service1_id, 'pending', now() + interval '1 day', 100, 'USD');

  -- 1 contract
  INSERT INTO contracts (id, client_id, provider_id, service_id, status, contract_date, total_amount, currency) 
  VALUES (gen_random_uuid(), client_id, provider_id, service1_id, 'draft', now(), 100, 'USD');
END $$;