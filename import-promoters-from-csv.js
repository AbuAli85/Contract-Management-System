// Import promoters from exported CSV back to Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Use current environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('❌ Environment variables not found!');
  console.log('Please check your .env file has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importPromotersFromCSV() {
  console.log('=== Importing Promoters from Exported CSV ===');
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_KEY exists:', !!SUPABASE_KEY);

  try {
    // Check for exported CSV file
    const csvFileName = 'promoters-export.csv'; // Default name from export
    const csvFilePath = `./${csvFileName}`;

    if (!fs.existsSync(csvFilePath)) {
      console.log('❌ CSV file not found!');
      console.log('Please make sure you have exported promoters to CSV first.');
      console.log('Expected file:', csvFilePath);
      console.log('');
      console.log('📋 Steps to export first:');
      console.log('1. Go to Promoter Management page');
      console.log('2. Click "Export CSV" button');
      console.log('3. Save the file as "promoters-export.csv" in this directory');
      console.log('4. Run this script again');
      return;
    }

    console.log('✅ Found CSV file:', csvFileName);
    console.log('📊 Reading CSV data...');

    const promoters = [];

    // Read CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns back to database fields
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Only add if we have at least a name and ID card number
        if (promoter.name_en && promoter.id_card_number) {
          promoters.push(promoter);
        }
      })
      .on('end', async () => {
        console.log(`📊 Found ${promoters.length} promoters in CSV`);

        if (promoters.length === 0) {
          console.log('❌ No valid promoters found in CSV');
          return;
        }

        console.log('🔄 Importing promoters to Supabase...');

        let successCount = 0;
        let errorCount = 0;

        // Import promoters one by one to handle errors
        for (const promoter of promoters) {
          try {
            const { error } = await supabase
              .from('promoters')
              .insert(promoter);

            if (error) {
              console.log(`❌ Error importing ${promoter.name_en}:`, error.message);
              errorCount++;
            } else {
              console.log(`✅ Imported: ${promoter.name_en}`);
              successCount++;
            }
          } catch (err) {
            console.log(`❌ Error importing ${promoter.name_en}:`, err.message);
            errorCount++;
          }
        }

        console.log('\n🎉 Import completed!');
        console.log(`✅ Successfully imported: ${successCount} promoters`);
        console.log(`❌ Failed to import: ${errorCount} promoters`);
        console.log(`📊 Total processed: ${promoters.length} promoters`);

        if (successCount > 0) {
          console.log('\n📋 Next steps:');
          console.log('1. Check your Promoter Management page');
          console.log('2. Verify the imported data');
          console.log('3. Update any missing relationships (companies, etc.)');
        }
      })
      .on('error', (error) => {
        console.log('❌ Error reading CSV file:', error.message);
      });

  } catch (error) {
    console.log('❌ Import failed:', error.message);
  }
}

// Check if csv-parser is installed
try {
  require('csv-parser');
  importPromotersFromCSV();
} catch (error) {
  console.log('❌ csv-parser not installed. Installing...');
  console.log('Please run: npm install csv-parser');
  console.log('Then run this script again.');
} 