// Export all data from old Supabase project
const { createClient } = require('@supabase/supabase-js');

// Old project credentials
const OLD_PROJECT_URL = 'https://ekdjxzhujettocosgzql.supabase.co';
const OLD_PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4dEssMk6wd_UQ5yNT1CfV6BAicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTkxMDYsImV4cCI6MjA2NDg5NTEwNn0.6VGbocKFVLNX_MCIOwFtdEssMk6wd_UQ5yNT1CfV6BA';

const oldSupabase = createClient(OLD_PROJECT_URL, OLD_PROJECT_KEY);

async function exportAllData() {
  console.log('=== Exporting Data from Old Project ===');
  
  try {
    // Export parties (companies)
    console.log('📊 Exporting parties...');
    const { data: parties, error: partiesError } = await oldSupabase
      .from('parties')
      .select('*');
    
    if (partiesError) {
      console.log('❌ Error exporting parties:', partiesError.message);
    } else {
      console.log(`✅ Exported ${parties.length} parties`);
      console.log('📁 Saving to parties-export.json...');
      require('fs').writeFileSync('parties-export.json', JSON.stringify(parties, null, 2));
    }

    // Export promoters
    console.log('📊 Exporting promoters...');
    const { data: promoters, error: promotersError } = await oldSupabase
      .from('promoters')
      .select('*');
    
    if (promotersError) {
      console.log('❌ Error exporting promoters:', promotersError.message);
    } else {
      console.log(`✅ Exported ${promoters.length} promoters`);
      console.log('📁 Saving to promoters-export.json...');
      require('fs').writeFileSync('promoters-export.json', JSON.stringify(promoters, null, 2));
    }

    // Export contracts
    console.log('📊 Exporting contracts...');
    const { data: contracts, error: contractsError } = await oldSupabase
      .from('contracts')
      .select('*');
    
    if (contractsError) {
      console.log('❌ Error exporting contracts:', contractsError.message);
    } else {
      console.log(`✅ Exported ${contracts.length} contracts`);
      console.log('📁 Saving to contracts-export.json...');
      require('fs').writeFileSync('contracts-export.json', JSON.stringify(contracts, null, 2));
    }

    // Export users
    console.log('📊 Exporting users...');
    const { data: users, error: usersError } = await oldSupabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Error exporting users:', usersError.message);
    } else {
      console.log(`✅ Exported ${users.length} users`);
      console.log('📁 Saving to users-export.json...');
      require('fs').writeFileSync('users-export.json', JSON.stringify(users, null, 2));
    }

    // Export audit logs
    console.log('📊 Exporting audit logs...');
    const { data: auditLogs, error: auditLogsError } = await oldSupabase
      .from('audit_logs')
      .select('*');
    
    if (auditLogsError) {
      console.log('❌ Error exporting audit logs:', auditLogsError.message);
    } else {
      console.log(`✅ Exported ${auditLogs.length} audit logs`);
      console.log('📁 Saving to audit-logs-export.json...');
      require('fs').writeFileSync('audit-logs-export.json', JSON.stringify(auditLogs, null, 2));
    }

    console.log('\n🎉 Data export completed!');
    console.log('📁 Check the generated JSON files in your project directory');
    
  } catch (error) {
    console.log('❌ Export failed:', error.message);
  }
}

exportAllData(); 