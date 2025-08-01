const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Initialize Supabase client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please make sure your .env file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (preferred)');
  console.log('OR NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importPartiesFromExport() {
  console.log('=== Importing Parties from Export CSV ===');
  
  const csvFilePath = 'parties-export-2025-08-01.csv';
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found: ${csvFilePath}`);
    console.log('Please make sure the file exists in the current directory');
    process.exit(1);
  }
  
  const companies = [];
  
  // Parse CSV data
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      companies.push(row);
    })
    .on('end', async () => {
      console.log(`📊 Found ${companies.length} companies to import`);
      
      let created = 0;
      let updated = 0;
      let failed = 0;
      
      for (const company of companies) {
        try {
          // Parse dates
          const parseDate = (dateStr) => {
            if (!dateStr || dateStr === 'N/A') return null;
            try {
              return new Date(dateStr).toISOString();
            } catch (error) {
              return null;
            }
          };

          // Parse active contracts to integer
          const parseActiveContracts = (value) => {
            if (!value || value === 'N/A') return 0;
            const parsed = parseInt(value);
            return isNaN(parsed) ? 0 : parsed;
          };

          // Check if company already exists by name
          const { data: existingCompany } = await supabase
            .from('parties')
            .select('id, name_en')
            .eq('name_en', company['Name (EN)'])
            .single();

          // Map to exact CSV structure
          const companyData = {
            name_en: company['Name (EN)'] || '',
            name_ar: company['Name (AR)'] || '',
            crn: company['CRN'] || '',
            type: company['Type'] || '',
            role: company['Role'] || '',
            status: company['Status'] || '',
            cr_status: company['CR Status'] || '',
            cr_expiry: company['CR Expiry'] || '',
            license_status: company['License Status'] || '',
            license_expiry: company['License Expiry'] || '',
            contact_person: company['Contact Person'] || '',
            contact_email: company['Contact Email'] || '',
            contact_phone: company['Contact Phone'] || '',
            address_en: company['Address (EN)'] || '',
            tax_number: company['Tax Number'] || '',
            license_number: company['License Number'] || '',
            active_contracts: parseActiveContracts(company['Active Contracts']),
            overall_status: company['Overall Status'] || 'active',
            created_at: parseDate(company['Created At']) || new Date().toISOString(),
            notes: company['Notes'] || ''
          };

          if (existingCompany) {
            // Update existing company
            const { error } = await supabase
              .from('parties')
              .update(companyData)
              .eq('id', existingCompany.id);
            
            if (error) {
              console.error(`❌ Error updating company ${company['Name (EN)']}:`, error.message);
              failed++;
            } else {
              console.log(`✅ Updated company: ${company['Name (EN)']} (Type: ${company['Type'] || 'N/A'}, CRN: ${company['CRN'] || 'N/A'}, Role: ${company['Role'] || 'N/A'})`);
              updated++;
            }
          } else {
            // Create new company
            const { error } = await supabase
              .from('parties')
              .insert([companyData]);
            
            if (error) {
              console.error(`❌ Error creating company ${company['Name (EN)']}:`, error.message);
              failed++;
            } else {
              console.log(`✅ Created company: ${company['Name (EN)']} (Type: ${company['Type'] || 'N/A'}, CRN: ${company['CRN'] || 'N/A'}, Role: ${company['Role'] || 'N/A'})`);
              created++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing company ${company['Name (EN)']}:`, error.message);
          failed++;
        }
      }
      
      console.log('\n=== Import Summary ===');
      console.log(`✅ Created: ${created} companies`);
      console.log(`🔄 Updated: ${updated} companies`);
      console.log(`❌ Failed: ${failed} companies`);
      console.log(`📊 Total processed: ${companies.length} companies`);
      
      // Show some sample data
      if (created > 0 || updated > 0) {
        console.log('\n=== Sample Imported Companies ===');
        const { data: sampleCompanies } = await supabase
          .from('parties')
          .select('name_en, type, overall_status, contact_email, crn')
          .limit(5);
        
        if (sampleCompanies && sampleCompanies.length > 0) {
          sampleCompanies.forEach((company, index) => {
            console.log(`  ${index + 1}. ${company.name_en} (${company.type || 'N/A'}) - ${company.overall_status}`);
            if (company.crn) {
              console.log(`     CRN: ${company.crn}`);
            }
          });
        }
      }
      
    })
    .on('error', (error) => {
      console.error('❌ Error reading CSV file:', error.message);
    });
}

// Handle CSV parser errors
process.on('uncaughtException', (error) => {
  if (error.message.includes('csv-parser')) {
    console.error('❌ Error: csv-parser package not found');
    console.log('Please install it with: npm install csv-parser');
    process.exit(1);
  }
  throw error;
});

importPartiesFromExport().catch(console.error); 