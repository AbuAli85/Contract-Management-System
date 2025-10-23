-- Migration: Create missing parties for contracts
-- Date: 2025-01-25
-- Description: Create placeholder parties for contracts that reference non-existent parties

-- Create a placeholder party for the specific UUID that's causing issues
INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Placeholder Client',
    'عميل مؤقت',
    'PLACEHOLDER-001',
    'Client',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create additional placeholder parties for common missing references
INSERT INTO parties (id, name_en, name_ar, crn, type, created_at, updated_at)
VALUES 
    (
        '00000000-0000-0000-0000-000000000002',
        'Placeholder Employer',
        'صاحب عمل مؤقت',
        'PLACEHOLDER-002',
        'Employer',
        NOW(),
        NOW()
    ),
    (
        '00000000-0000-0000-0000-000000000003',
        'System Generated Party',
        'طرف مولود من النظام',
        'SYSTEM-001',
        'Generic',
        NOW(),
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE parties IS 'Stores party information for contracts. Includes placeholder entries for data integrity.';
