-- Migration: Enable pg_trgm extension and create search functions
-- Date: 2025-07-29
-- Description: Enable pg_trgm extension for fuzzy search and create search_parties RPC

-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for trigram search on parties table
CREATE INDEX IF NOT EXISTS idx_parties_name_en_trgm ON parties USING gin(name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_parties_name_ar_trgm ON parties USING gin(name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_parties_crn_trgm ON parties USING gin(crn gin_trgm_ops);

-- Create indexes for trigram search on contacts table
CREATE INDEX IF NOT EXISTS idx_contacts_name_en_trgm ON contacts USING gin(name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_name_ar_trgm ON contacts USING gin(name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm ON contacts USING gin(email gin_trgm_ops);

-- Create function to search parties with fuzzy matching
CREATE OR REPLACE FUNCTION search_parties(search_text TEXT)
RETURNS TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    crn TEXT,
    type TEXT,
    status TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ,
    similarity_score REAL,
    match_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name_en,
        p.name_ar,
        p.crn,
        p.type,
        p.status,
        p.contact_person,
        p.contact_email,
        p.contact_phone,
        p.created_at,
        GREATEST(
            similarity(p.name_en, search_text),
            similarity(p.name_ar, search_text),
            similarity(p.crn, search_text),
            similarity(p.contact_person, search_text),
            similarity(p.contact_email, search_text)
        ) as similarity_score,
        CASE 
            WHEN p.name_en ILIKE '%' || search_text || '%' OR p.name_ar ILIKE '%' || search_text || '%' THEN 'exact_match'
            WHEN similarity(p.name_en, search_text) > 0.3 OR similarity(p.name_ar, search_text) > 0.3 THEN 'fuzzy_match'
            WHEN p.crn ILIKE '%' || search_text || '%' THEN 'crn_match'
            WHEN p.contact_person ILIKE '%' || search_text || '%' THEN 'contact_match'
            WHEN p.contact_email ILIKE '%' || search_text || '%' THEN 'email_match'
            ELSE 'low_similarity'
        END as match_type
    FROM parties p
    WHERE 
        p.name_en ILIKE '%' || search_text || '%' OR
        p.name_ar ILIKE '%' || search_text || '%' OR
        p.crn ILIKE '%' || search_text || '%' OR
        p.contact_person ILIKE '%' || search_text || '%' OR
        p.contact_email ILIKE '%' || search_text || '%' OR
        similarity(p.name_en, search_text) > 0.3 OR
        similarity(p.name_ar, search_text) > 0.3 OR
        similarity(p.crn, search_text) > 0.3
    ORDER BY 
        CASE 
            WHEN p.name_en ILIKE '%' || search_text || '%' OR p.name_ar ILIKE '%' || search_text || '%' THEN 1
            WHEN p.crn ILIKE '%' || search_text || '%' THEN 2
            WHEN p.contact_person ILIKE '%' || search_text || '%' OR p.contact_email ILIKE '%' || search_text || '%' THEN 3
            ELSE 4
        END,
        similarity_score DESC,
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search parties with contacts included
CREATE OR REPLACE FUNCTION search_parties_with_contacts(search_text TEXT)
RETURNS TABLE (
    id UUID,
    name_en TEXT,
    name_ar TEXT,
    crn TEXT,
    type TEXT,
    status TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ,
    similarity_score REAL,
    match_type TEXT,
    contact_count BIGINT,
    primary_contact_name TEXT,
    primary_contact_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name_en,
        p.name_ar,
        p.crn,
        p.type,
        p.status,
        p.contact_person,
        p.contact_email,
        p.contact_phone,
        p.created_at,
        GREATEST(
            similarity(p.name_en, search_text),
            similarity(p.name_ar, search_text),
            similarity(p.crn, search_text),
            similarity(p.contact_person, search_text),
            similarity(p.contact_email, search_text),
            COALESCE(similarity(c.name_en, search_text), 0),
            COALESCE(similarity(c.name_ar, search_text), 0),
            COALESCE(similarity(c.email, search_text), 0)
        ) as similarity_score,
        CASE 
            WHEN p.name_en ILIKE '%' || search_text || '%' OR p.name_ar ILIKE '%' || search_text || '%' THEN 'exact_match'
            WHEN similarity(p.name_en, search_text) > 0.3 OR similarity(p.name_ar, search_text) > 0.3 THEN 'fuzzy_match'
            WHEN p.crn ILIKE '%' || search_text || '%' THEN 'crn_match'
            WHEN p.contact_person ILIKE '%' || search_text || '%' THEN 'contact_match'
            WHEN p.contact_email ILIKE '%' || search_text || '%' THEN 'email_match'
            WHEN c.name_en ILIKE '%' || search_text || '%' OR c.name_ar ILIKE '%' || search_text || '%' THEN 'contact_name_match'
            WHEN c.email ILIKE '%' || search_text || '%' THEN 'contact_email_match'
            ELSE 'low_similarity'
        END as match_type,
        COALESCE(contact_stats.contact_count, 0) as contact_count,
        primary_contact.name_en as primary_contact_name,
        primary_contact.email as primary_contact_email
    FROM parties p
    LEFT JOIN contacts c ON p.id = c.party_id AND (
        c.name_en ILIKE '%' || search_text || '%' OR
        c.name_ar ILIKE '%' || search_text || '%' OR
        c.email ILIKE '%' || search_text || '%' OR
        similarity(c.name_en, search_text) > 0.3 OR
        similarity(c.name_ar, search_text) > 0.3 OR
        similarity(c.email, search_text) > 0.3
    )
    LEFT JOIN (
        SELECT 
            party_id,
            COUNT(*) as contact_count
        FROM contacts
        GROUP BY party_id
    ) contact_stats ON p.id = contact_stats.party_id
    LEFT JOIN (
        SELECT 
            party_id,
            name_en,
            email
        FROM contacts
        WHERE is_primary = TRUE
    ) primary_contact ON p.id = primary_contact.party_id
    WHERE 
        p.name_en ILIKE '%' || search_text || '%' OR
        p.name_ar ILIKE '%' || search_text || '%' OR
        p.crn ILIKE '%' || search_text || '%' OR
        p.contact_person ILIKE '%' || search_text || '%' OR
        p.contact_email ILIKE '%' || search_text || '%' OR
        similarity(p.name_en, search_text) > 0.3 OR
        similarity(p.name_ar, search_text) > 0.3 OR
        similarity(p.crn, search_text) > 0.3 OR
        c.id IS NOT NULL
    ORDER BY 
        CASE 
            WHEN p.name_en ILIKE '%' || search_text || '%' OR p.name_ar ILIKE '%' || search_text || '%' THEN 1
            WHEN p.crn ILIKE '%' || search_text || '%' THEN 2
            WHEN p.contact_person ILIKE '%' || search_text || '%' OR p.contact_email ILIKE '%' || search_text || '%' THEN 3
            WHEN c.name_en ILIKE '%' || search_text || '%' OR c.name_ar ILIKE '%' || search_text || '%' THEN 4
            WHEN c.email ILIKE '%' || search_text || '%' THEN 5
            ELSE 6
        END,
        similarity_score DESC,
        p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION search_parties(TEXT) IS 'Search parties with fuzzy matching using pg_trgm';
COMMENT ON FUNCTION search_parties_with_contacts(TEXT) IS 'Search parties with contacts included using fuzzy matching';