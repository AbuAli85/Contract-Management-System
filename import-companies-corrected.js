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

async function importCompaniesCorrected() {
  console.log('=== Importing Companies (Corrected Schema) ===');
  
  // Create CSV file from the provided data
  const csvData = `Name (EN),Name (AR),CRN,Type,Role,Status,CR Status,CR Expiry,License Status,License Expiry,Contact Person,Contact Email,Contact Phone,Address (EN),Tax Number,License Number,Active Contracts,Overall Status,Created At,Notes
"AL AMRI INVESTMENT AND SERVICES LLC","العامري للاستثمار والخدمات ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","84","active","2025-07-02",""
"Amjad Al Maerifa LLC","امجاد المعرفة ش م م","1173975","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-26",""
"Falcon Eye Modern Investments SPC","صقر العين للاستثمارات الحديثة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Projects Management","إدارة مشاريع صقر العين","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""
"Falcon Eye Trading LLC","صقر العين للتجارة ش م م","1315483","Employer","ceo","Active","missing","N/A","missing","N/A","Fahad alamri","chairman@falconeyegroup.net","+96895153930","N/A","N/A","N/A","0","active","2025-07-02",""`;

  const csvFilePath = 'companies-import-corrected.csv';
  fs.writeFileSync(csvFilePath, csvData);
  console.log(`✅ Created CSV file: ${csvFilePath}`);

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
          // Check if company already exists by name (since CRN might not be in schema)
          const { data: existingCompany } = await supabase
            .from('parties')
            .select('id, name')
            .eq('name', company['Name (EN)'])
            .single();

          // Map to actual database schema
          const companyData = {
            name: company['Name (EN)'] || '',
            type: company['Type'] || 'Employer',
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
            status: company['Status'] || 'Active',
            created_at: new Date().toISOString(),
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
              console.log(`✅ Updated company: ${company['Name (EN)']}`);
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
              console.log(`✅ Created company: ${company['Name (EN)']}`);
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
      
      // Clean up CSV file
      fs.unlinkSync(csvFilePath);
      console.log(`🗑️ Cleaned up: ${csvFilePath}`);
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

importCompaniesCorrected().catch(console.error); 