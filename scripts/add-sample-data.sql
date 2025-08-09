-- Sample data script for Contract Management System
-- This will add sample contracts to populate the dashboard

-- First, let's check if we have parties to work with
-- INSERT sample contracts using existing parties

INSERT INTO contracts (
  first_party_id,
  second_party_id,
  promoter_id,
  contract_start_date,
  contract_end_date,
  job_title,
  contract_type,
  status,
  contract_value,
  currency,
  email,
  special_terms,
  work_location,
  department,
  contract_number
) VALUES 
-- Sample Contract 1
(
  (SELECT id FROM parties WHERE type = 'Client' LIMIT 1),
  (SELECT id FROM parties WHERE type = 'Employer' LIMIT 1),
  (SELECT id FROM promoters LIMIT 1),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  'Software Developer',
  'full-time-permanent',
  'active',
  45000,
  'OMR',
  'developer@company.com',
  'Standard employment terms with probation period',
  'Muscat Office',
  'IT Department',
  'CNT-2024-001'
),
-- Sample Contract 2
(
  (SELECT id FROM parties WHERE type = 'Client' LIMIT 1 OFFSET 1),
  (SELECT id FROM parties WHERE type = 'Employer' LIMIT 1),
  (SELECT id FROM promoters LIMIT 1 OFFSET 1),
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '6 months',
  'Marketing Specialist',
  'contract',
  'pending',
  35000,
  'OMR',
  'marketing@company.com',
  'Fixed-term contract with renewal option',
  'Salalah Office',
  'Marketing',
  'CNT-2024-002'
),
-- Sample Contract 3
(
  (SELECT id FROM parties WHERE type = 'Client' LIMIT 1 OFFSET 2),
  (SELECT id FROM parties WHERE type = 'Employer' LIMIT 1),
  (SELECT id FROM promoters LIMIT 1 OFFSET 2),
  CURRENT_DATE - INTERVAL '60 days',
  CURRENT_DATE + INTERVAL '2 years',
  'Project Manager',
  'full-time-permanent',
  'active',
  55000,
  'OMR',
  'pm@company.com',
  'Senior position with team leadership responsibilities',
  'Muscat Office',
  'Operations',
  'CNT-2024-003'
),
-- Sample Contract 4 (Completed)
(
  (SELECT id FROM parties WHERE type = 'Client' LIMIT 1 OFFSET 3),
  (SELECT id FROM parties WHERE type = 'Employer' LIMIT 1),
  (SELECT id FROM promoters LIMIT 1 OFFSET 3),
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE - INTERVAL '10 days',
  'Data Analyst',
  'contract',
  'completed',
  40000,
  'OMR',
  'analyst@company.com',
  'Short-term project completion',
  'Remote',
  'Analytics',
  'CNT-2024-004'
);

-- Add some recent activity by updating contract statuses
UPDATE contracts 
SET status = 'active', 
    updated_at = CURRENT_TIMESTAMP 
WHERE contract_number = 'CNT-2024-002';

-- Insert some activity logs if you have an activity table
-- (This is optional and depends on your schema)
/*
INSERT INTO activity_logs (action, description, created_at, user_id) VALUES
('contract_created', 'New software developer contract created', NOW() - INTERVAL '1 day', (SELECT id FROM auth.users LIMIT 1)),
('contract_updated', 'Marketing specialist contract status updated', NOW() - INTERVAL '2 hours', (SELECT id FROM auth.users LIMIT 1)),
('promoter_assigned', 'Promoter assigned to project manager role', NOW() - INTERVAL '30 minutes', (SELECT id FROM auth.users LIMIT 1));
*/