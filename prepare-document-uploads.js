#!/usr/bin/env node

/**
 * Promoters Document Upload Preparation Tool
 * Generates a priority list for document uploads based on promoters data
 */

const fs = require('fs');
const path = require('path');

// Read the analysis summary
const summaryPath = path.join(__dirname, 'promoters_analysis_summary.json');
let summary = {};

if (fs.existsSync(summaryPath)) {
  summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
}

// Read the CSV file
const csvPath = path.join(__dirname, 'promoters_data.csv');
const csvData = fs.readFileSync(csvPath, 'utf8');
const lines = csvData.split('\n');
const headers = lines[0].split(',');
const records = lines.slice(1).filter(line => line.trim()).map(line => {
  const values = line.split(',');
  const record = {};
  headers.forEach((header, index) => {
    record[header] = values[index] || '';
  });
  return record;
});

console.log('📋 PROMOTERS DOCUMENT UPLOAD PREPARATION');
console.log('=' .repeat(50));
console.log();

// Create priority list for document uploads
const now = new Date();
const promotersNeedingDocs = records.map(record => {
  const nameEn = record.name_en || 'Unknown';
  const idCard = record.id_card_number || '';
  const passport = record.passport_number || '';
  const idExpiry = record.id_card_expiry_date;
  const passportExpiry = record.passport_expiry_date;
  
  // Clean name for filename generation
  const cleanName = nameEn
    .replace(/[^a-zA-Z0-9\s]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);

  // Calculate priority score
  let priority = 0;
  let reasons = [];
  
  // High priority: Expiring ID cards
  if (idExpiry) {
    const expiryDate = new Date(idExpiry);
    const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry <= 90 && daysUntilExpiry > 0) {
      priority += 100;
      reasons.push(`ID expires in ${Math.ceil(daysUntilExpiry)} days`);
    } else if (daysUntilExpiry <= 0) {
      priority += 200;
      reasons.push('ID EXPIRED');
    }
  }
  
  // Medium priority: No documents uploaded
  if (!record.id_card_url || record.id_card_url.trim() === '') {
    priority += 50;
    reasons.push('No ID card uploaded');
  }
  
  if (!record.passport_url || record.passport_url.trim() === '') {
    priority += 30;
    reasons.push('No passport uploaded');
  }
  
  // Lower priority: Missing data
  if (!passport || passport.trim() === '') {
    priority += 10;
    reasons.push('Missing passport number');
  }
  
  if (!record.email || record.email.trim() === '' || record.email === 'N/A') {
    priority += 5;
    reasons.push('Missing email');
  }

  return {
    id: record.id,
    name: nameEn,
    nameAr: record.name_ar,
    idCard: idCard,
    passport: passport,
    cleanName: cleanName,
    priority: priority,
    reasons: reasons,
    idExpiry: idExpiry,
    passportExpiry: passportExpiry,
    hasIdDoc: record.id_card_url && record.id_card_url.trim() !== '',
    hasPassportDoc: record.passport_url && record.passport_url.trim() !== '',
    expectedIdFilename: `${cleanName}_${idCard}.jpg`,
    expectedPassportFilename: passport ? `${cleanName}_${passport}.jpg` : `${cleanName}_NO_PASSPORT.jpg`,
    employerId: record.employer_id
  };
}).filter(p => p.priority > 0).sort((a, b) => b.priority - a.priority);

console.log(`🎯 PRIORITY LIST FOR DOCUMENT UPLOADS (${promotersNeedingDocs.length} promoters)`);
console.log('-'.repeat(60));

// High priority (urgent)
const urgent = promotersNeedingDocs.filter(p => p.priority >= 100);
if (urgent.length > 0) {
  console.log('🚨 URGENT (Expiring/Expired IDs):');
  urgent.slice(0, 10).forEach((promoter, index) => {
    console.log(`${index + 1}. ${promoter.name}`);
    console.log(`   ID: ${promoter.idCard} | Priority: ${promoter.priority}`);
    console.log(`   Reasons: ${promoter.reasons.join(', ')}`);
    console.log(`   Expected filename: ${promoter.expectedIdFilename}`);
    console.log();
  });
}

// Medium priority (no documents)
const medium = promotersNeedingDocs.filter(p => p.priority >= 50 && p.priority < 100);
console.log(`📋 MEDIUM PRIORITY (Missing Documents) - ${medium.length} promoters:`);
medium.slice(0, 15).forEach((promoter, index) => {
  console.log(`${index + 1}. ${promoter.name} (${promoter.idCard})`);
  console.log(`   Expected ID filename: ${promoter.expectedIdFilename}`);
  if (promoter.passport) {
    console.log(`   Expected Passport filename: ${promoter.expectedPassportFilename}`);
  }
  console.log(`   Issues: ${promoter.reasons.join(', ')}`);
  console.log();
});

// Generate CSV file for bulk processing
const csvHeaders = [
  'Name (English)',
  'Name (Arabic)', 
  'ID Card Number',
  'Passport Number',
  'Priority',
  'Issues',
  'Expected ID Filename',
  'Expected Passport Filename',
  'ID Expiry',
  'Has ID Document',
  'Has Passport Document'
];

const csvContent = [
  csvHeaders.join(','),
  ...promotersNeedingDocs.slice(0, 50).map(p => [
    `"${p.name}"`,
    `"${p.nameAr}"`,
    p.idCard,
    p.passport || '',
    p.priority,
    `"${p.reasons.join('; ')}"`,
    `"${p.expectedIdFilename}"`,
    `"${p.expectedPassportFilename}"`,
    p.idExpiry || '',
    p.hasIdDoc ? 'Yes' : 'No',
    p.hasPassportDoc ? 'Yes' : 'No'
  ].join(','))
].join('\n');

fs.writeFileSync('promoters_upload_priority.csv', csvContent);

console.log();
console.log('💾 GENERATED FILES:');
console.log('   📊 promoters_upload_priority.csv - Priority list for uploads');
console.log('   📋 promoters_analysis_summary.json - Data analysis summary');

console.log();
console.log('📋 BULK UPLOAD WORKFLOW:');
console.log('1. 🎯 Start with URGENT promoters (expiring IDs)');
console.log('2. 📤 Use the expected filenames for consistency');
console.log('3. 📋 Work through MEDIUM priority (missing documents)');
console.log('4. ✅ Mark completed uploads in your system');
console.log('5. 🔄 Re-run this tool after updates to refresh priorities');

console.log();
console.log('📁 FILENAME FORMAT EXAMPLES:');
console.log('   ✅ ID Card: pachlasawala_fakhruddin_139449759.jpg');
console.log('   ✅ Passport: ali_hassan_P123456789.jpg');
console.log('   ⚠️ No Passport: ahmad_salem_NO_PASSPORT.jpg');

console.log();
console.log('🎯 NEXT STEPS:');
console.log('1. Open promoters_upload_priority.csv in Excel/Sheets');
console.log('2. Sort by Priority (highest first)');
console.log('3. Start uploading documents for top promoters');
console.log('4. Use the exact expected filenames shown');
console.log('5. Update your system after each batch upload');

// Statistics
console.log();
console.log('📊 SUMMARY STATISTICS:');
console.log(`   🚨 Urgent (expiring IDs): ${urgent.length}`);
console.log(`   📋 Medium (missing docs): ${medium.length}`);
console.log(`   📄 Total needing attention: ${promotersNeedingDocs.length}/100`);
console.log(`   ✅ Complete records: ${100 - promotersNeedingDocs.length}/100`);

// Generate sample form data for testing
const samplePromoter = promotersNeedingDocs[0];
if (samplePromoter) {
  console.log();
  console.log('🧪 SAMPLE FORM DATA FOR TESTING:');
  console.log(`   Name: ${samplePromoter.name}`);
  console.log(`   ID Number: ${samplePromoter.idCard}`);
  console.log(`   Passport: ${samplePromoter.passport || 'Not provided'}`);
  console.log(`   Expected ID filename: ${samplePromoter.expectedIdFilename}`);
}
