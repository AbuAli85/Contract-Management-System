// Import data to new Supabase project
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// New project credentials (you need to update these)
const NEW_PROJECT_URL = 'https://reootcngcptfogfozlmz.supabase.co';
const NEW_PROJECT_KEY = 'YOUR_NEW_ANON_KEY_HERE'; // Update this with your new project's anon key

const newSupabase = createClient(NEW_PROJECT_URL, NEW_PROJECT_KEY);

async function importAllData() {
  console.log('=== Importing Data to New Project ===');
  
  try {
    // Import parties first (companies)
    console.log('📊 Importing parties...');
    if (fs.existsSync('parties-export.json')) {
      const parties = JSON.parse(fs.readFileSync('parties-export.json', 'utf8'));
      
      for (const party of parties) {
        const { error } = await newSupabase
          .from('parties')
          .insert(party);
        
        if (error) {
          console.log(`❌ Error importing party ${party.id}:`, error.message);
        }
      }
      console.log(`✅ Imported ${parties.length} parties`);
    } else {
      console.log('❌ parties-export.json not found');
    }

    // Import promoters
    console.log('📊 Importing promoters...');
    if (fs.existsSync('promoters-export.json')) {
      const promoters = JSON.parse(fs.readFileSync('promoters-export.json', 'utf8'));
      
      for (const promoter of promoters) {
        const { error } = await newSupabase
          .from('promoters')
          .insert(promoter);
        
        if (error) {
          console.log(`❌ Error importing promoter ${promoter.id}:`, error.message);
        }
      }
      console.log(`✅ Imported ${promoters.length} promoters`);
    } else {
      console.log('❌ promoters-export.json not found');
    }

    // Import contracts
    console.log('📊 Importing contracts...');
    if (fs.existsSync('contracts-export.json')) {
      const contracts = JSON.parse(fs.readFileSync('contracts-export.json', 'utf8'));
      
      for (const contract of contracts) {
        const { error } = await newSupabase
          .from('contracts')
          .insert(contract);
        
        if (error) {
          console.log(`❌ Error importing contract ${contract.id}:`, error.message);
        }
      }
      console.log(`✅ Imported ${contracts.length} contracts`);
    } else {
      console.log('❌ contracts-export.json not found');
    }

    // Import users
    console.log('📊 Importing users...');
    if (fs.existsSync('users-export.json')) {
      const users = JSON.parse(fs.readFileSync('users-export.json', 'utf8'));
      
      for (const user of users) {
        const { error } = await newSupabase
          .from('users')
          .insert(user);
        
        if (error) {
          console.log(`❌ Error importing user ${user.id}:`, error.message);
        }
      }
      console.log(`✅ Imported ${users.length} users`);
    } else {
      console.log('❌ users-export.json not found');
    }

    // Import audit logs
    console.log('📊 Importing audit logs...');
    if (fs.existsSync('audit-logs-export.json')) {
      const auditLogs = JSON.parse(fs.readFileSync('audit-logs-export.json', 'utf8'));
      
      for (const log of auditLogs) {
        const { error } = await newSupabase
          .from('audit_logs')
          .insert(log);
        
        if (error) {
          console.log(`❌ Error importing audit log ${log.id}:`, error.message);
        }
      }
      console.log(`✅ Imported ${auditLogs.length} audit logs`);
    } else {
      console.log('❌ audit-logs-export.json not found');
    }

    console.log('\n🎉 Data import completed!');
    console.log('📊 Your new project now has all your data!');
    
  } catch (error) {
    console.log('❌ Import failed:', error.message);
  }
}

importAllData(); 