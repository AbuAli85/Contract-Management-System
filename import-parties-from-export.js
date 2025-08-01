const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please make sure your .env file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
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

          // Check if company already exists by name
          const { data: existingCompany } = await supabase
            .from('parties')
            .select('id, name')
            .eq('name', company['Name (EN)'])
            .single();

          // Create notes with employer role and CRN information
          let notes = '';
          if (company['Type'] === 'Employer') {
            notes += 'Role: Employer. ';
          }
          if (company['CRN'] && company['CRN'] !== 'N/A') {
            notes += `CRN: ${company['CRN']}. `;
          }
          if (company['Notes'] && company['Notes'] !== '') {
            notes += company['Notes'];
          }

          // Map to actual database schema with correct type value and CRN
          const companyData = {
            name: company['Name (EN)'] || '',
            type: 'company', // Use 'company' as it's the only valid type
            email: company['Contact Email'] || '',
            phone: company['Contact Phone'] || '',
            address: {
              street: company['Address (EN)'] || '',
              city: '',
              state: '',
              country: '',
              postal_code: ''
            },
            tax_id: {
              number: company['Tax Number'] || '',
              type: 'tax'
            },
            registration_number: {
              number: company['CRN'] || '',
              type: 'CRN'
            },
            status: company['Status'] || 'Active',
            created_at: parseDate(company['Created At']) || new Date().toISOString(),
            updated_at: new Date().toISOString()
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
              console.log(`✅ Updated company: ${company['Name (EN)']} (CRN: ${company['CRN'] || 'N/A'}, Role: ${company['Type']})`);
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
              console.log(`✅ Created company: ${company['Name (EN)']} (CRN: ${company['CRN'] || 'N/A'}, Role: ${company['Type']})`);
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
          .select('name, type, status, email, registration_number')
          .limit(5);
        
        if (sampleCompanies && sampleCompanies.length > 0) {
          sampleCompanies.forEach((company, index) => {
            console.log(`  ${index + 1}. ${company.name} (${company.type}) - ${company.status}`);
            if (company.registration_number && company.registration_number.number) {
              console.log(`     CRN: ${company.registration_number.number}`);
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