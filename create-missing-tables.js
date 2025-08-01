const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createMissingTables() {
  console.log('=== Creating Missing Tables ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // SQL to create missing tables
    const createTablesSQL = `
      -- Promoter Tags (simple version)
      CREATE TABLE IF NOT EXISTS promoter_tags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
          tag TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_promoter_tags_promoter ON promoter_tags(promoter_id);

      -- Promoter Skills
      CREATE TABLE IF NOT EXISTS promoter_skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
          skill TEXT NOT NULL,
          level TEXT,
          years_experience INT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_promoter_skills_promoter ON promoter_skills(promoter_id);

      -- Promoter Experience
      CREATE TABLE IF NOT EXISTS promoter_experience (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
          company TEXT NOT NULL,
          position TEXT,
          start_date DATE,
          end_date DATE,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_promoter_experience_promoter ON promoter_experience(promoter_id);

      -- Promoter Education
      CREATE TABLE IF NOT EXISTS promoter_education (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
          institution TEXT NOT NULL,
          degree TEXT,
          field_of_study TEXT,
          start_date DATE,
          end_date DATE,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_promoter_education_promoter ON promoter_education(promoter_id);

      -- Promoter Documents
      CREATE TABLE IF NOT EXISTS promoter_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
          document_type TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_name TEXT,
          uploaded_at TIMESTAMPTZ DEFAULT NOW(),
          description TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_promoter_documents_promoter ON promoter_documents(promoter_id);
    `
    
    console.log('\n1. Creating missing tables...')
    
    // Execute the SQL using RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTablesSQL })
    
    if (error) {
      console.error('❌ Failed to create tables:', error.message)
      console.log('🔍 Trying alternative method...')
      
      // Alternative: Try to create tables one by one
      const tables = [
        'promoter_tags',
        'promoter_skills', 
        'promoter_experience',
        'promoter_education',
        'promoter_documents'
      ]
      
      for (const table of tables) {
        console.log(`   Checking ${table}...`)
        const { error: checkError } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (checkError && checkError.message.includes('does not exist')) {
          console.log(`   ❌ ${table} table missing`)
        } else {
          console.log(`   ✅ ${table} table exists`)
        }
      }
      
      console.log('\n📝 Please run the SQL script manually in Supabase SQL Editor:')
      console.log('   Copy the SQL from scripts/021_create_promoter_profile_tables.sql')
      
    } else {
      console.log('✅ Tables created successfully!')
    }
    
    // Test if promoter_tags table now exists
    console.log('\n2. Testing promoter_tags table...')
    const { data: testData, error: testError } = await supabase
      .from('promoter_tags')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ promoter_tags table still missing:', testError.message)
    } else {
      console.log('✅ promoter_tags table now exists!')
    }
    
    console.log('\n=== Table Creation Complete ===')
    
  } catch (error) {
    console.error('❌ Table creation failed:', error.message)
  }
}

createMissingTables().catch(console.error) 