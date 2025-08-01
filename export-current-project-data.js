// Export all data from current project to check what exists
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('=== Exporting Data from Current Project ===');
console.log('Current SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('❌ Environment variables not loaded!');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function exportCurrentProjectData() {
  try {
    console.log('🔍 Checking all tables in current project...');
    
    // Check all tables
    const tables = ['promoters', 'parties', 'contracts', 'users', 'audit_logs'];
    
    for (const tableName of tables) {
      console.log(`📊 Checking ${tableName} table...`);
      
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');
        
        if (error) {
          if (error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`❌ Table ${tableName} does not exist`);
          } else {
            console.log(`❌ Error accessing ${tableName}:`, error.message);
          }
        } else {
          console.log(`✅ Found ${data.length} records in ${tableName}`);
          
          if (data.length > 0) {
            // Save to JSON file
            const filename = `${tableName}-current-export.json`;
            fs.writeFileSync(filename, JSON.stringify(data, null, 2));
            console.log(`📁 Saved to ${filename}`);
            
            // Show sample data
            console.log(`📋 Sample ${tableName} data:`, data[0]);
          }
        }
      } catch (err) {
        console.log(`❌ Error checking ${tableName}:`, err.message);
      }
    }
    
    // Check if tables exist at all
    console.log('\n🔍 Checking database schema...');
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.log('❌ Error checking schema:', schemaError.message);
      } else {
        console.log('📋 Available tables:', schemaData.map(t => t.table_name).join(', '));
      }
    } catch (err) {
      console.log('❌ Error checking schema:', err.message);
    }
    
    console.log('\n🎉 Export check completed!');
    
  } catch (error) {
    console.log('❌ Export failed:', error.message);
  }
}

exportCurrentProjectData(); 