// Fix CSV format for direct Supabase import
const fs = require('fs');
const csv = require('csv-parser');

console.log('=== Fixing CSV for Supabase Direct Import ===');

// Check for CSV file
const possibleFileNames = [
  'promoters-export-2025-08-01.csv',
  'promoters-export.csv',
  'sample-promoters-export.csv'
];

let csvFilePath = null;
let csvFileName = null;

for (const fileName of possibleFileNames) {
  if (fs.existsSync(`./${fileName}`)) {
    csvFilePath = `./${fileName}`;
    csvFileName = fileName;
    break;
  }
}

if (!csvFilePath) {
  console.log('❌ CSV file not found!');
  console.log('Please make sure you have one of these files:');
  possibleFileNames.forEach(name => console.log(`  - ${name}`));
  process.exit(1);
}

console.log('✅ Found CSV file:', csvFileName);
console.log('📊 Converting CSV format for Supabase...');

const rows = [];

// Read and convert CSV
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    // Parse dates properly
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === 'N/A') return null;
      
      // Handle DD-MM-YY format
      if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const day = parts[0];
          const month = parts[1];
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      // Handle YYYY-MM-DD format
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      
      return null;
    };

    // Convert to Supabase-compatible format
    const convertedRow = {
      name_en: row['Name (EN)'] || '',
      name_ar: row['Name (AR)'] || '',
      id_card_number: row['ID Card Number'] || '',
      passport_number: row['Passport Number'] || '',
      mobile_number: row['Mobile'] || '',
      phone: row['Phone'] || '',
      email: row['Email'] || '',
      nationality: row['Nationality'] || '',
      date_of_birth: parseDate(row['Date of Birth']),
      gender: row['Gender'] || null,
      address: row['Address'] || '',
      emergency_contact: row['Emergency Contact'] || '',
      emergency_phone: row['Emergency Phone'] || '',
      job_title: row['Job Title'] || '',
      work_location: row['Work Location'] || '',
      status: row['Status'] || 'active',
      notes: row['Notes'] || '',
      id_card_expiry_date: parseDate(row['ID Card Expiry']),
      passport_expiry_date: parseDate(row['Passport Expiry']),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    rows.push(convertedRow);
  })
  .on('end', () => {
    console.log(`📊 Processed ${rows.length} rows`);

    // Create new CSV with correct format
    const outputFileName = 'promoters-supabase-ready.csv';
    
    // Create CSV content
    const headers = Object.keys(rows[0] || {});
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if needed
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    // Write the fixed CSV
    fs.writeFileSync(outputFileName, csvContent);
    
    console.log('✅ Created fixed CSV:', outputFileName);
    console.log('📋 CSV is now ready for Supabase direct import!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to Supabase Dashboard > Table Editor > promoters');
    console.log('2. Click "Insert" > "Upload CSV"');
    console.log('3. Upload the file:', outputFileName);
    console.log('4. The data should now import without compatibility issues');
  })
  .on('error', (error) => {
    console.log('❌ Error processing CSV:', error.message);
  }); 