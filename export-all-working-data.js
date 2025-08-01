// Export all working data from the current application
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

console.log('=== Exporting All Working Data ===');
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

async function exportAllWorkingData() {
  try {
    console.log('🔍 Exporting all data from working application...');
    
    // Export promoters (156 records)
    console.log('📊 Exporting promoters...');
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('*');
    
    if (promotersError) {
      console.log('❌ Error exporting promoters:', promotersError.message);
    } else {
      console.log(`✅ Exported ${promoters.length} promoters`);
      fs.writeFileSync('promoters-export.json', JSON.stringify(promoters, null, 2));
      console.log('📁 Saved to promoters-export.json');
      
      // Show sample promoter data
      if (promoters.length > 0) {
        console.log('📋 Sample promoter:', {
          name_en: promoters[0].name_en,
          name_ar: promoters[0].name_ar,
          id_card_number: promoters[0].id_card_number,
          status: promoters[0].status
        });
      }
    }

    // Export parties/companies (16 records)
    console.log('📊 Exporting parties/companies...');
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('*');
    
    if (partiesError) {
      console.log('❌ Error exporting parties:', partiesError.message);
    } else {
      console.log(`✅ Exported ${parties.length} parties/companies`);
      fs.writeFileSync('parties-export.json', JSON.stringify(parties, null, 2));
      console.log('📁 Saved to parties-export.json');
      
      // Show sample company data
      if (parties.length > 0) {
        console.log('📋 Sample company:', {
          name: parties[0].name,
          type: parties[0].type,
          status: parties[0].status
        });
      }
    }

    // Export contracts (170 records)
    console.log('📊 Exporting contracts...');
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*');
    
    if (contractsError) {
      console.log('❌ Error exporting contracts:', contractsError.message);
    } else {
      console.log(`✅ Exported ${contracts.length} contracts`);
      fs.writeFileSync('contracts-export.json', JSON.stringify(contracts, null, 2));
      console.log('📁 Saved to contracts-export.json');
    }

    // Export users
    console.log('📊 Exporting users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Error exporting users:', usersError.message);
    } else {
      console.log(`✅ Exported ${users.length} users`);
      fs.writeFileSync('users-export.json', JSON.stringify(users, null, 2));
      console.log('📁 Saved to users-export.json');
    }

    // Export audit logs
    console.log('📊 Exporting audit logs...');
    const { data: auditLogs, error: auditLogsError } = await supabase
      .from('audit_logs')
      .select('*');
    
    if (auditLogsError) {
      console.log('❌ Error exporting audit logs:', auditLogsError.message);
    } else {
      console.log(`✅ Exported ${auditLogs.length} audit logs`);
      fs.writeFileSync('audit-logs-export.json', JSON.stringify(auditLogs, null, 2));
      console.log('📁 Saved to audit-logs-export.json');
    }

    // Create summary report
    const summary = {
      exportDate: new Date().toISOString(),
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      dataSummary: {
        promoters: promoters?.length || 0,
        parties: parties?.length || 0,
        contracts: contracts?.length || 0,
        users: users?.length || 0,
        auditLogs: auditLogs?.length || 0
      },
      files: [
        'promoters-export.json',
        'parties-export.json', 
        'contracts-export.json',
        'users-export.json',
        'audit-logs-export.json'
      ]
    };

    fs.writeFileSync('export-summary.json', JSON.stringify(summary, null, 2));
    console.log('📁 Saved export summary to export-summary.json');

    console.log('\n🎉 Export completed successfully!');
    console.log('📊 Data Summary:');
    console.log(`   - Promoters: ${summary.dataSummary.promoters}`);
    console.log(`   - Companies: ${summary.dataSummary.parties}`);
    console.log(`   - Contracts: ${summary.dataSummary.contracts}`);
    console.log(`   - Users: ${summary.dataSummary.users}`);
    console.log(`   - Audit Logs: ${summary.dataSummary.auditLogs}`);
    console.log('\n📁 All data saved to JSON files for backup!');
    
  } catch (error) {
    console.log('❌ Export failed:', error.message);
  }
}

exportAllWorkingData(); 