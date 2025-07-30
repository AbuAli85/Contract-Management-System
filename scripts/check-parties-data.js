const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPartiesData() {
  try {
    console.log("🔍 Checking parties table...")

    // Check if parties table exists and has data
    const { data: parties, error } = await supabase.from("parties").select("*").limit(10)

    if (error) {
      console.error("❌ Error accessing parties table:", error.message)

      // Try to create the parties table if it doesn't exist
      console.log("🔄 Attempting to create parties table...")
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.parties (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name_en VARCHAR(255) NOT NULL,
          name_ar VARCHAR(255) NOT NULL,
          crn VARCHAR(100) NOT NULL,
          type VARCHAR(50) CHECK (type IN ('Employer', 'Client', 'Generic')),
          role VARCHAR(100),
          cr_expiry_date DATE,
          contact_person VARCHAR(255),
          contact_email VARCHAR(255),
          contact_phone VARCHAR(50),
          address_en TEXT,
          address_ar TEXT,
          tax_number VARCHAR(100),
          license_number VARCHAR(100),
          license_expiry_date DATE,
          status VARCHAR(50) DEFAULT 'active',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          owner_id UUID REFERENCES auth.users(id)
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_parties_type ON public.parties(type);
        CREATE INDEX IF NOT EXISTS idx_parties_status ON public.parties(status);
        CREATE INDEX IF NOT EXISTS idx_parties_cr_expiry ON public.parties(cr_expiry_date);
        
        -- Enable RLS
        ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        DROP POLICY IF EXISTS "Allow read access to all authenticated users on parties" ON public.parties;
        CREATE POLICY "Allow read access to all authenticated users on parties"
        ON public.parties FOR SELECT
        TO authenticated
        USING (true);
        
        DROP POLICY IF EXISTS "Allow authenticated users to insert parties" ON public.parties;
        CREATE POLICY "Allow authenticated users to insert parties"
        ON public.parties FOR INSERT
        TO authenticated
        WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow authenticated users to update parties" ON public.parties;
        CREATE POLICY "Allow authenticated users to update parties"
        ON public.parties FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Allow authenticated users to delete parties" ON public.parties;
        CREATE POLICY "Allow authenticated users to delete parties"
        ON public.parties FOR DELETE
        TO authenticated
        USING (true);
      `

      const { error: createError } = await supabase.rpc("exec_sql", { sql: createTableSQL })

      if (createError) {
        console.error("❌ Failed to create parties table:", createError.message)
        return
      }

      console.log("✅ Parties table created successfully")
    } else {
      console.log(`✅ Parties table exists with ${parties?.length || 0} records`)

      if (!parties || parties.length === 0) {
        console.log("📝 No parties found. Inserting sample data...")
        await insertSampleParties()
      } else {
        console.log("📊 Sample parties data:")
        parties.forEach((party, index) => {
          console.log(
            `  ${index + 1}. ${party.name_en} (${party.type || "Generic"}) - CRN: ${party.crn}`,
          )
        })
      }
    }

    // Check promoters table as well
    console.log("\n🔍 Checking promoters table...")
    const { data: promoters, error: promotersError } = await supabase
      .from("promoters")
      .select("*")
      .limit(5)

    if (promotersError) {
      console.error("❌ Error accessing promoters table:", promotersError.message)
    } else {
      console.log(`✅ Promoters table exists with ${promoters?.length || 0} records`)

      if (!promoters || promoters.length === 0) {
        console.log("📝 No promoters found. Inserting sample data...")
        await insertSamplePromoters()
      } else {
        console.log("📊 Sample promoters data:")
        promoters.forEach((promoter, index) => {
          console.log(`  ${index + 1}. ${promoter.name_en} - ID: ${promoter.id_card_number}`)
        })
      }
    }
  } catch (error) {
    console.error("❌ Error checking data:", error.message)
  }
}

async function insertSampleParties() {
  const sampleParties = [
    {
      name_en: "Oman Oil Company",
      name_ar: "شركة النفط العمانية",
      crn: "OM123456789",
      type: "Employer",
      contact_person: "Ahmed Al-Rashdi",
      contact_email: "ahmed.alrashdi@omanoil.com",
      contact_phone: "+968 1234 5678",
      address_en: "Muscat, Oman",
      address_ar: "مسقط، عمان",
      status: "active",
    },
    {
      name_en: "Petroleum Development Oman",
      name_ar: "شركة تنمية نفط عمان",
      crn: "OM987654321",
      type: "Employer",
      contact_person: "Fatima Al-Zadjali",
      contact_email: "fatima.alzadjali@pdo.co.om",
      contact_phone: "+968 9876 5432",
      address_en: "Muscat, Oman",
      address_ar: "مسقط، عمان",
      status: "active",
    },
    {
      name_en: "ABC Construction Company",
      name_ar: "شركة إيه بي سي للإنشاءات",
      crn: "OM456789123",
      type: "Client",
      contact_person: "Mohammed Al-Harthy",
      contact_email: "mohammed.alharthy@abc-construction.com",
      contact_phone: "+968 4567 8912",
      address_en: "Salalah, Oman",
      address_ar: "صلالة، عمان",
      status: "active",
    },
    {
      name_en: "XYZ Manufacturing Ltd",
      name_ar: "شركة إكس واي زد للتصنيع",
      crn: "OM789123456",
      type: "Client",
      contact_person: "Salma Al-Balushi",
      contact_email: "salma.balushi@xyz-manufacturing.com",
      contact_phone: "+968 7891 2345",
      address_en: "Sohar, Oman",
      address_ar: "صحار، عمان",
      status: "active",
    },
  ]

  const { data, error } = await supabase.from("parties").insert(sampleParties).select()

  if (error) {
    console.error("❌ Error inserting sample parties:", error.message)
  } else {
    console.log(`✅ Inserted ${data?.length || 0} sample parties`)
  }
}

async function insertSamplePromoters() {
  const samplePromoters = [
    {
      name_en: "Ali Hassan Al-Mahri",
      name_ar: "علي حسن المهرى",
      id_card_number: "1234567890",
      status: "active",
      job_title: "Senior Engineer",
      work_location: "Muscat",
    },
    {
      name_en: "Aisha Mohammed Al-Rashdi",
      name_ar: "عائشة محمد الراشدي",
      id_card_number: "0987654321",
      status: "active",
      job_title: "Project Manager",
      work_location: "Salalah",
    },
    {
      name_en: "Omar Khalid Al-Zadjali",
      name_ar: "عمر خالد الزدجالي",
      id_card_number: "1122334455",
      status: "active",
      job_title: "Technical Specialist",
      work_location: "Sohar",
    },
  ]

  const { data, error } = await supabase.from("promoters").insert(samplePromoters).select()

  if (error) {
    console.error("❌ Error inserting sample promoters:", error.message)
  } else {
    console.log(`✅ Inserted ${data?.length || 0} sample promoters`)
  }
}

// Run the check
checkPartiesData()
