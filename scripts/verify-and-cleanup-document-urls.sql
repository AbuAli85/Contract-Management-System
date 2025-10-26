-- Verification & Cleanup Script
-- This will help identify which URLs are broken/invalid
-- We need to remove URLs that point to non-existent files

-- First, let's see which URLs might be broken
-- Based on the error pattern, we need to identify constructed URLs vs real ones

-- =================================================================
-- STEP 1: Keep only URLs that we KNOW exist (from your original data)
-- =================================================================

-- Reset all URLs that were auto-generated (we'll rebuild correctly)
UPDATE promoters
SET 
    id_card_url = NULL,
    passport_url = NULL,
    updated_at = NOW()
WHERE id_card_url IS NOT NULL OR passport_url IS NOT NULL;

-- =================================================================
-- STEP 2: Now update ONLY with patterns we KNOW work from your data
-- =================================================================

-- Based on your actual files, update known good URLs
-- These are confirmed to exist in storage

-- Pattern 1: Standard {name}_{id_number}.png
UPDATE promoters
SET id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
    lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
    '_' || id_card_number || '.png'
WHERE name_en IN (
    'muhammad asim zafar',
    'bilal ahmed bhatti',
    'muhammad arshad',
    'muhammad azeem',
    'luqman shahzada',
    'muhammad sajjad khan',
    'haseeb arslan',
    'karam din',
    'rasheed bilavinakath',
    'sajjad hussain',
    'umesh purushothaman nair',
    'usman javed',
    'yasir karuppanooppan abdul',
    'ali turab shah',
    'muhammad junaid',
    'hasan alam',
    'muhammad jasim',
    'muhammad asjad sultan',
    'muhammad ehtisham zubair',
    'muhammad waqar',
    'muhammad mohsin',
    'muhammad maqsood',
    'rameez ramzan',
    'muhammad farooq',
    'muhammad zeeshan',
    'muhammad rehan',
    'yasir ali',
    'shahmeer abdul sattar',
    'ahmad yar',
    'adeel aziz',
    'abdul wahab makki ali',
    'ali husnain karamat ali',
    'mohammad mujahid arafat',
    'abdullah muhammad ilyas',
    'bilal nabi bakhsh',
    'muhammad amir',
    'mahaboob pasha shaik',
    'mohamed yahia mohamed abdelmonem',
    'faisal siddique',
    'habeeb adnan habeeb ali',
    'kaif ali khan',
    'kashif ali',
    'ayub ansari',
    'azhar habib',
    'syed ghazanfar hussain bukhari',
    'shahid mehmood',
    'mubeen pasha mohammed'
);

-- Pattern 2: Standard {name}_{id_number}.jpeg
UPDATE promoters
SET id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' || 
    lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) || 
    '_' || id_card_number || '.jpeg'
WHERE name_en IN (
    'abdul basit',
    'ali usman chaudhary',
    'asad shakeel',
    'husnain sohail butt',
    'abdelrhman ahmed hassan abdelmoniem hassan',
    'haider ali gulam abbas merchant',
    'muhammad waqas',
    'sagar aranakkal bharathan',
    'mohammed khaleel',
    'syed atif',
    'pachlasawala fakhruddin'
);

-- Pattern 3: Uppercase name files (like MAHMOUD)
UPDATE promoters
SET id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    upper(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) ||
    '_' || id_card_number || '.png'
WHERE name_en IN ('MAHMOUD ELMASRY ABDELKARIM ZAHRAN');

-- Pattern 4: Mixed case names (like Muhammad_qamar)
UPDATE promoters
SET id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/Muhammad_qamar_131092996.png'
WHERE id = 'd39417a8-b2a1-4617-9b58-52e59ae0a08d';

-- Special case: vishnu dathan binu files for ahtisham ul haq
UPDATE promoters
SET 
    id_card_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/vishnu_dathan_binu_132593631.png',
    passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/vishnu_dathan_binu_t9910557.png'
WHERE id = '5b6fc012-e6df-4168-b01f-14d6009bb23b';

-- =================================================================
-- PASSPORT URLs - Known working patterns
-- =================================================================

-- Pattern 1: Lowercase passport number
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) ||
    '_' || lower(passport_number) || '.png'
WHERE name_en IN (
    'luqman shahzada',
    'umesh purushothaman nair',
    'yasir karuppanooppan abdul',
    'ali turab shah',
    'muhammad junaid',
    'hasan alam',
    'muhammad asjad sultan',
    'muhammad ehtisham zubair',
    'muhammad rehan',
    'abdelazim magdi abdelazim',
    'abdelrehim salah mohamed youssef',
    'habeeb adnan habeeb ali',
    'amir sohail',
    'rashid bilal',
    'sagar aranakkal bharathan',
    'muhammad amir',
    'shahid mehmood',
    'zainul abedeen',
    'sohail shahid',
    'rehan mehmood'
);

-- Pattern 2: Uppercase passport number
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) ||
    '_' || upper(passport_number) || '.png'
WHERE name_en IN (
    'kaif ali khan',
    'siddiq syed'
);

-- Pattern 3: Passport .jpeg files
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) ||
    '_' || lower(passport_number) || '.jpeg'
WHERE name_en IN (
    'abdul basit',
    'asad shakeel',
    'ali usman chaudhary',
    'mohammed khaleel',
    'syed atif',
    'pachlasawala fakhruddin',
    'sagar aranakkal bharathan'
);

-- Pattern 4: NO_PASSPORT placeholder (.png)
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) ||
    '_NO_PASSPORT.png'
WHERE name_en IN (
    'muhammad asim zafar',
    'ahmad yar',
    'abdul wahab makki ali',
    'ali husnain karamat ali',
    'mohammad mujahid arafat',
    'abdullah muhammad ilyas',
    'adeel aziz',
    'muhammad jasim',
    'haseeb arslan',
    'karam din',
    'rasheed bilavinakath',
    'sajjad hussain',
    'usman javed',
    'yasir ali',
    'muhammad waqar',
    'rameez ramzan',
    'muhammad farooq',
    'muhammad zeeshan',
    'muhammad mohsin',
    'muhammad maqsood',
    'muhammad rehan',
    'faisal siddique',
    'kashif ali',
    'ayub ansari',
    'azhar habib',
    'syed ghazanfar hussain bukhari',
    'mubeen pasha mohammed',
    'muhammad sajjad khan',
    'marijoe bulabon pino',
    'bilal nabi bakhsh',
    'shahmeer abdul sattar',
    'muhammad azeem',
    'muhammad arshad',
    'ahmed khalil',
    'hafiz muhammad bilal',
    'mahaboob pasha shaik',
    'mohamed yahia mohamed abdelmonem',
    'johirul islam'
);

-- Pattern 5: NO_PASSPORT placeholder (.jpeg)
UPDATE promoters
SET passport_url = 'https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/promoter-documents/' ||
    lower(regexp_replace(regexp_replace(name_en, '[^a-zA-Z0-9]+', '_', 'g'), '_+', '_', 'g')) ||
    '_NO_PASSPORT.jpeg'
WHERE name_en IN (
    'husnain sohail butt',
    'abdelrhman ahmed hassan abdelmoniem hassan',
    'haider ali gulam abbas merchant',
    'MAHMOUD ELMASRY ABDELKARIM ZAHRAN'
);

-- =================================================================
-- VERIFICATION: Show what's actually linked now
-- =================================================================

SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN id_card_url IS NOT NULL THEN 1 END) as with_id,
    COUNT(CASE WHEN passport_url IS NOT NULL THEN 1 END) as with_passport,
    COUNT(CASE WHEN id_card_url IS NOT NULL AND passport_url IS NOT NULL THEN 1 END) as complete
FROM promoters;

-- Show promoters still with NULL URLs
SELECT 
    name_en,
    id_card_number,
    passport_number,
    id_card_url,
    passport_url
FROM promoters
WHERE id_card_url IS NULL OR passport_url IS NULL
ORDER BY name_en;

