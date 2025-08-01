// Advanced import script for promoters with company relationships
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Use current environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('❌ Environment variables not found!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importPromotersWithCompanies() {
  console.log('=== Advanced Import: Promoters with Companies ===');

  try {
    // First, let's check what companies exist in the database
    console.log('📊 Checking existing companies...');
    const { data: existingCompanies, error: companiesError } = await supabase
      .from('parties')
      .select('id, name_en, name_ar, type')
      .eq('type', 'Employer');

    if (companiesError) {
      console.log('❌ Error fetching companies:', companiesError.message);
      return;
    }

    console.log(`✅ Found ${existingCompanies.length} existing companies`);

    // Create a map for quick company lookup
    const companyMap = new Map();
    existingCompanies.forEach(company => {
      const key = company.name_en?.toLowerCase().trim();
      if (key) {
        companyMap.set(key, company.id);
      }
    });

    // Check for CSV file
    const csvFileName = 'promoters-export.csv';
    const csvFilePath = `./${csvFileName}`;

    if (!fs.existsSync(csvFilePath)) {
      console.log('❌ CSV file not found!');
      console.log('Please export promoters first using the "Export CSV" button');
      return;
    }

    console.log('✅ Found CSV file:', csvFileName);
    console.log('📊 Reading and processing data...');

    const promoters = [];
    const newCompanies = new Set();

    // Read CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const companyName = row['Company'] || '';
        
        // Track new companies that need to be created
        if (companyName && companyName !== 'N/A' && !companyMap.has(companyName.toLowerCase().trim())) {
          newCompanies.add(companyName);
        }

        const promoter = {
          name_en: row['Name (EN)'] || '',
          name_ar: row['Name (AR)'] || '',
          id_card_number: row['ID Card Number'] || '',
          passport_number: row['Passport Number'] || '',
          mobile_number: row['Mobile'] || '',
          phone: row['Phone'] || '',
          email: row['Email'] || '',
          nationality: row['Nationality'] || '',
          date_of_birth: row['Date of Birth'] && row['Date of Birth'] !== 'N/A' ? row['Date of Birth'] : null,
          gender: row['Gender'] || null,
          address: row['Address'] || '',
          emergency_contact: row['Emergency Contact'] || '',
          emergency_phone: row['Emergency Phone'] || '',
          job_title: row['Job Title'] || '',
          work_location: row['Work Location'] || '',
          status: row['Status'] || 'active',
          notes: row['Notes'] || '',
          company_name: companyName, // Store for later processing
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (promoter.name_en && promoter.id_card_number) {
          promoters.push(promoter);
        }
      })
      .on('end', async () => {
        console.log(`📊 Found ${promoters.length} promoters in CSV`);
        console.log(`🏢 Found ${newCompanies.size} new companies to create`);

        // Step 1: Create new companies if needed
        if (newCompanies.size > 0) {
          console.log('🔄 Creating new companies...');
          
          for (const companyName of newCompanies) {
            try {
              const { data: newCompany, error } = await supabase
                .from('parties')
                .insert({
                  name_en: companyName,
                  name_ar: companyName, // You can update this later
                  type: 'Employer',
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select('id, name_en')
                .single();

              if (error) {
                console.log(`❌ Error creating company ${companyName}:`, error.message);
              } else {
                console.log(`✅ Created company: ${companyName}`);
                companyMap.set(companyName.toLowerCase().trim(), newCompany.id);
              }
            } catch (err) {
              console.log(`❌ Error creating company ${companyName}:`, err.message);
            }
          }
        }

        // Step 2: Import promoters with company relationships
        console.log('🔄 Importing promoters with company relationships...');

        let successCount = 0;
        let errorCount = 0;
        let updateCount = 0;

        for (const promoter of promoters) {
          try {
            // Find company ID
            let employerId = null;
            if (promoter.company_name && promoter.company_name !== 'N/A') {
              employerId = companyMap.get(promoter.company_name.toLowerCase().trim());
            }

            // Check if promoter already exists (by ID card number)
            const { data: existingPromoter } = await supabase
              .from('promoters')
              .select('id')
              .eq('id_card_number', promoter.id_card_number)
              .single();

            const promoterData = {
              name_en: promoter.name_en,
              name_ar: promoter.name_ar,
              id_card_number: promoter.id_card_number,
              passport_number: promoter.passport_number,
              mobile_number: promoter.mobile_number,
              phone: promoter.phone,
              email: promoter.email,
              nationality: promoter.nationality,
              date_of_birth: promoter.date_of_birth,
              gender: promoter.gender,
              address: promoter.address,
              emergency_contact: promoter.emergency_contact,
              emergency_phone: promoter.emergency_phone,
              job_title: promoter.job_title,
              work_location: promoter.work_location,
              status: promoter.status,
              notes: promoter.notes,
              employer_id: employerId,
              updated_at: new Date().toISOString()
            };

            let result;
            if (existingPromoter) {
              // Update existing promoter
              result = await supabase
                .from('promoters')
                .update(promoterData)
                .eq('id', existingPromoter.id);
              updateCount++;
            } else {
              // Insert new promoter
              result = await supabase
                .from('promoters')
                .insert({
                  ...promoterData,
                  created_at: new Date().toISOString()
                });
            }

            if (result.error) {
              console.log(`❌ Error importing ${promoter.name_en}:`, result.error.message);
              errorCount++;
            } else {
              console.log(`✅ ${existingPromoter ? 'Updated' : 'Imported'}: ${promoter.name_en}${employerId ? ` (Company: ${promoter.company_name})` : ''}`);
              successCount++;
            }
          } catch (err) {
            console.log(`❌ Error importing ${promoter.name_en}:`, err.message);
            errorCount++;
          }
        }

        console.log('\n🎉 Import completed!');
        console.log(`✅ Successfully processed: ${successCount} promoters`);
        console.log(`🔄 Updated existing: ${updateCount} promoters`);
        console.log(`❌ Failed to process: ${errorCount} promoters`);
        console.log(`📊 Total processed: ${promoters.length} promoters`);

        if (successCount > 0) {
          console.log('\n📋 Next steps:');
          console.log('1. Check your Promoter Management page');
          console.log('2. Verify the imported data and company relationships');
          console.log('3. Update any missing information manually if needed');
        }
      });

  } catch (error) {
    console.log('❌ Import failed:', error.message);
  }
}

// Check if csv-parser is installed
try {
  require('csv-parser');
  importPromotersWithCompanies();
} catch (error) {
  console.log('❌ csv-parser not installed. Installing...');
  console.log('Please run: npm install csv-parser');
  console.log('Then run this script again.');
} 