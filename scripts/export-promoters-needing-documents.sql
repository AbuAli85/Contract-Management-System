-- Export List of Promoters Needing Document Upload
-- These 42 promoters have NO documents in storage

SELECT 
    name_en as "Promoter Name (English)",
    name_ar as "Promoter Name (Arabic)",
    id_card_number as "ID Card Number",
    passport_number as "Passport Number",
    email as "Email",
    phone as "Phone",
    mobile_number as "Mobile",
    employer_id as "Employer ID",
    'URGENT: Please upload ID card and passport documents' as "Action Required",
    CONCAT(
        'Please upload documents to: https://portal.thesmartpro.io/profile'
    ) as "Upload Instructions"
FROM promoters
WHERE id_card_url IS NULL 
  AND passport_url IS NULL
ORDER BY name_en;

-- Also get their employer information for context
SELECT 
    p.name_en as "Promoter",
    p.id_card_number as "ID Number",
    p.passport_number as "Passport Number",
    p.email as "Promoter Email",
    p.mobile_number as "Promoter Phone",
    pa.name_en as "Employer Name",
    pa.contact_email as "Employer Email",
    pa.contact_phone as "Employer Phone"
FROM promoters p
LEFT JOIN parties pa ON p.employer_id = pa.id
WHERE p.id_card_url IS NULL 
  AND p.passport_url IS NULL
ORDER BY pa.name_en, p.name_en;

