// Import Excel/CSV data to new Supabase project
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Use current environment variables
require('dotenv').config();

const NEW_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_PROJECT_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!NEW_PROJECT_URL || !NEW_PROJECT_KEY) {
  console.log('❌ Environment variables not found!');
  process.exit(1);
}

const newSupabase = createClient(NEW_PROJECT_URL, NEW_PROJECT_KEY);

async function importExcelData() {
  console.log('=== Importing Excel/CSV Data to New Project ===');
  
  try {
    // Import promoters from CSV
    console.log('📊 Importing promoters from CSV...');
    
    if (fs.existsSync('test-import.csv')) {
      const promoters = [];
      
      // Read CSV file
      fs.createReadStream('test-import.csv')
        .pipe(csv())
        .on('data', (row) => {
                     // Map CSV columns to database fields (matching actual schema)
           const promoter = {
             name_en: row['Name (English)'] || '',
             name_ar: row['Name (Arabic)'] || '',
             id_card_number: row['ID Card Number'] || '',
             mobile_number: row['Mobile'] || '',
             nationality: row['Nationality'] || '',
             id_card_expiry_date: row['ID Expiry Date'] ? new Date(row['ID Expiry Date']) : null,
             passport_expiry_date: row['Passport Expiry Date'] ? new Date(row['Passport Expiry Date']) : null,
             status: 'active',
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString()
           };
          
          promoters.push(promoter);
        })
        .on('end', async () => {
          console.log(`📊 Found ${promoters.length} promoters in CSV`);
          
          // Import promoters to database
          for (const promoter of promoters) {
            try {
              const { error } = await newSupabase
                .from('promoters')
                .insert(promoter);
              
              if (error) {
                console.log(`❌ Error importing promoter ${promoter.name_en}:`, error.message);
              } else {
                console.log(`✅ Imported: ${promoter.name_en}`);
              }
            } catch (err) {
              console.log(`❌ Error importing promoter ${promoter.name_en}:`, err.message);
            }
          }
          
          console.log(`🎉 Successfully imported ${promoters.length} promoters!`);
        });
    } else {
      console.log('❌ test-import.csv not found');
    }

    // Import companies if available
    console.log('📊 Checking for companies data...');
    
    if (fs.existsSync('test-import-with-companies.csv')) {
      const companies = [];
      
      fs.createReadStream('test-import-with-companies.csv')
        .pipe(csv())
        .on('data', (row) => {
          // Map CSV columns to database fields for companies
          const company = {
            name: row['Company Name'] || row['Name'] || '',
            type: 'company',
            email: row['Email'] || '',
            phone: row['Phone'] || '',
            address: row['Address'] || '',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          if (company.name) {
            companies.push(company);
          }
        })
        .on('end', async () => {
          if (companies.length > 0) {
            console.log(`📊 Found ${companies.length} companies in CSV`);
            
            // Import companies to database
            for (const company of companies) {
              try {
                const { error } = await newSupabase
                  .from('parties')
                  .insert(company);
                
                if (error) {
                  console.log(`❌ Error importing company ${company.name}:`, error.message);
                } else {
                  console.log(`✅ Imported company: ${company.name}`);
                }
              } catch (err) {
                console.log(`❌ Error importing company ${company.name}:`, err.message);
              }
            }
            
            console.log(`🎉 Successfully imported ${companies.length} companies!`);
          }
        });
    } else {
      console.log('ℹ️ No companies CSV found, skipping companies import');
    }
    
  } catch (error) {
    console.log('❌ Import failed:', error.message);
  }
}

// Check if csv-parser is installed
try {
  require('csv-parser');
  importExcelData();
} catch (error) {
  console.log('❌ csv-parser not installed. Installing...');
  console.log('Please run: npm install csv-parser');
  console.log('Then run this script again.');
} 