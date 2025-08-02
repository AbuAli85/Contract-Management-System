#!/usr/bin/env node

/**
 * Promoters Data Analysis Utility
 * Analyzes the promoters CSV data and provides insights
 */

const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = path.join(__dirname, 'promoters_data.csv');

if (!fs.existsSync(csvPath)) {
  console.error('❌ promoters_data.csv not found. Please copy the file to the project root.');
  process.exit(1);
}

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

console.log('🔍 PROMOTERS DATA ANALYSIS');
console.log('=' .repeat(50));
console.log(`📊 Total Records: ${records.length}`);
console.log(`📋 Fields: ${headers.length}`);
console.log();

// Analyze data completeness
console.log('📈 DATA COMPLETENESS ANALYSIS');
console.log('-'.repeat(30));

const fieldsToAnalyze = [
  'name_en',
  'name_ar', 
  'id_card_number',
  'passport_number',
  'id_card_url',
  'passport_url',
  'email',
  'phone',
  'mobile_number',
  'date_of_birth',
  'nationality',
  'employer_id'
];

fieldsToAnalyze.forEach(field => {
  const filledCount = records.filter(r => r[field] && r[field].trim() !== '' && r[field] !== 'N/A').length;
  const percentage = ((filledCount / records.length) * 100).toFixed(1);
  const status = percentage > 80 ? '✅' : percentage > 50 ? '⚠️' : '❌';
  console.log(`${status} ${field.padEnd(20)} ${filledCount.toString().padStart(3)}/${records.length} (${percentage}%)`);
});

console.log();

// Analyze filename generation potential
console.log('📁 FILENAME GENERATION ANALYSIS');
console.log('-'.repeat(35));

let goodIdCardFilenames = 0;
let goodPassportFilenames = 0;
let longNames = 0;
const sampleFilenames = [];

records.slice(0, 10).forEach(record => {
  const nameEn = record.name_en || 'Unknown';
  const idCard = record.id_card_number || '';
  const passport = record.passport_number || '';
  
  // Clean name for filename
  const cleanName = nameEn
    .replace(/[^a-zA-Z0-9\s]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 50);
  
  if (cleanName.length > 30) longNames++;
  
  // Generate sample filenames
  if (idCard) {
    const idFilename = `${cleanName}_${idCard}.jpg`;
    sampleFilenames.push(`ID: ${idFilename}`);
    goodIdCardFilenames++;
  }
  
  if (passport) {
    const passportFilename = `${cleanName}_${passport}.jpg`;
    sampleFilenames.push(`PP: ${passportFilename}`);
    goodPassportFilenames++;
  }
});

console.log(`✅ Good ID Card filenames: ${goodIdCardFilenames}/${records.length} (${((goodIdCardFilenames/records.length)*100).toFixed(1)}%)`);
console.log(`✅ Good Passport filenames: ${goodPassportFilenames}/${records.length} (${((goodPassportFilenames/records.length)*100).toFixed(1)}%)`);
console.log(`⚠️ Long names (>30 chars): ${longNames}/${Math.min(10, records.length)}`);

console.log();
console.log('📝 SAMPLE FILENAMES:');
sampleFilenames.slice(0, 8).forEach(filename => {
  console.log(`   ${filename}`);
});

console.log();

// Employer analysis
console.log('🏢 EMPLOYER DISTRIBUTION');
console.log('-'.repeat(25));

const employerCounts = {};
records.forEach(record => {
  const employerId = record.employer_id || 'Unknown';
  employerCounts[employerId] = (employerCounts[employerId] || 0) + 1;
});

const sortedEmployers = Object.entries(employerCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);

sortedEmployers.forEach(([employerId, count]) => {
  console.log(`   ${employerId.substring(0, 8)}... : ${count} promoters`);
});

console.log();

// Document status analysis
console.log('📄 DOCUMENT STATUS');
console.log('-'.repeat(20));

const hasIdCard = records.filter(r => r.id_card_url && r.id_card_url.trim() !== '').length;
const hasPassport = records.filter(r => r.passport_url && r.passport_url.trim() !== '').length;
const hasNoDocuments = records.filter(r => 
  (!r.id_card_url || r.id_card_url.trim() === '') && 
  (!r.passport_url || r.passport_url.trim() === '')
).length;

console.log(`📋 ID Card uploaded: ${hasIdCard}/${records.length} (${((hasIdCard/records.length)*100).toFixed(1)}%)`);
console.log(`📋 Passport uploaded: ${hasPassport}/${records.length} (${((hasPassport/records.length)*100).toFixed(1)}%)`);  
console.log(`❌ No documents: ${hasNoDocuments}/${records.length} (${((hasNoDocuments/records.length)*100).toFixed(1)}%)`);

console.log();

// Expiry analysis
console.log('⏰ EXPIRY DATE ANALYSIS');
console.log('-'.repeat(25));

const now = new Date();
const soonExpiring = records.filter(record => {
  const idExpiry = record.id_card_expiry_date;
  if (idExpiry) {
    const expiryDate = new Date(idExpiry);
    const daysUntilExpiry = (expiryDate - now) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  }
  return false;
});

const expired = records.filter(record => {
  const idExpiry = record.id_card_expiry_date;
  if (idExpiry) {
    const expiryDate = new Date(idExpiry);
    return expiryDate < now;
  }
  return false;
});

console.log(`⚠️ Expiring soon (90 days): ${soonExpiring.length}`);
console.log(`❌ Already expired: ${expired.length}`);

if (soonExpiring.length > 0) {
  console.log('\n🚨 PROMOTERS WITH EXPIRING ID CARDS:');
  soonExpiring.slice(0, 5).forEach(record => {
    const daysLeft = Math.ceil((new Date(record.id_card_expiry_date) - now) / (1000 * 60 * 60 * 24));
    console.log(`   ${record.name_en} - ${record.id_card_number} (${daysLeft} days)`);
  });
}

console.log();

// Summary and recommendations
console.log('💡 RECOMMENDATIONS');
console.log('-'.repeat(20));
console.log('1. 📤 Upload missing documents for promoters without ID/Passport files');
console.log('2. 📝 Complete missing passport numbers for international travel');
console.log('3. 📞 Update contact information (email, phone) for better communication');
console.log('4. 🗓️ Monitor and renew expiring ID cards');
console.log('5. 🧹 Clean up test/sample records');
console.log();

// Export summary
const summary = {
  totalRecords: records.length,
  documentStatus: {
    hasIdCard,
    hasPassport,
    hasNoDocuments
  },
  completeness: {
    idCardNumbers: records.filter(r => r.id_card_number && r.id_card_number.trim() !== '').length,
    passportNumbers: records.filter(r => r.passport_number && r.passport_number.trim() !== '').length,
    emails: records.filter(r => r.email && r.email.trim() !== '' && r.email !== 'N/A').length,
  },
  expiry: {
    soonExpiring: soonExpiring.length,
    expired: expired.length
  }
};

fs.writeFileSync('promoters_analysis_summary.json', JSON.stringify(summary, null, 2));
console.log('💾 Analysis summary saved to: promoters_analysis_summary.json');
console.log('🎯 Run this script anytime to analyze updated promoter data!');
