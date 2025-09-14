#!/usr/bin/env node

/**
 * HR Module Setup Script
 * 
 * This script sets up the HR module for the Contract Management System.
 * It creates storage buckets, uploads templates, and sets up initial data.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupHRModule() {
  console.log('🚀 Setting up HR Module...\n');

  try {
    // 1. Create storage buckets
    console.log('📁 Creating storage buckets...');
    await createStorageBuckets();
    
    // 2. Upload document templates
    console.log('📄 Uploading document templates...');
    await uploadTemplates();
    
    // 3. Create HR admin user profile
    console.log('👤 Setting up HR admin user...');
    await setupHRAdmin();
    
    // 4. Insert sample data
    console.log('📊 Inserting sample data...');
    await insertSampleData();
    
    console.log('\n✅ HR Module setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run database migrations: npm run db:migrate');
    console.log('   2. Start the development server: npm run dev');
    console.log('   3. Navigate to /hr to access the HR dashboard');
    console.log('   4. Create your first employee record');
    
  } catch (error) {
    console.error('❌ Error setting up HR module:', error.message);
    process.exit(1);
  }
}

async function createStorageBuckets() {
  // Create employee-docs bucket
  const { error: employeeDocsError } = await supabase.storage.createBucket('employee-docs', {
    public: false,
    allowedMimeTypes: ['application/pdf', 'image/*', 'text/html', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    fileSizeLimit: 10485760 // 10MB
  });

  if (employeeDocsError && !employeeDocsError.message.includes('already exists')) {
    throw new Error(`Failed to create employee-docs bucket: ${employeeDocsError.message}`);
  }

  // Create hr-templates bucket
  const { error: templatesError } = await supabase.storage.createBucket('hr-templates', {
    public: false,
    allowedMimeTypes: ['text/html', 'text/plain'],
    fileSizeLimit: 1048576 // 1MB
  });

  if (templatesError && !templatesError.message.includes('already exists')) {
    throw new Error(`Failed to create hr-templates bucket: ${templatesError.message}`);
  }

  console.log('   ✅ Storage buckets created');
}

async function uploadTemplates() {
  const templatesDir = path.join(process.cwd(), 'public', 'hr-templates');
  
  if (!fs.existsSync(templatesDir)) {
    console.log('   ⚠️  Templates directory not found, skipping template upload');
    return;
  }

  const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.hbs'));
  
  for (const file of templateFiles) {
    const filePath = path.join(templatesDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    const { error } = await supabase.storage
      .from('hr-templates')
      .upload(file, fileContent, {
        contentType: 'text/html',
        upsert: true
      });

    if (error) {
      console.log(`   ⚠️  Failed to upload ${file}: ${error.message}`);
    } else {
      console.log(`   ✅ Uploaded ${file}`);
    }
  }
}

async function setupHRAdmin() {
  // This would typically be done through the UI or a separate admin setup
  console.log('   ℹ️  HR admin setup should be done through the UI');
}

async function insertSampleData() {
  // Insert sample departments if they don't exist
  const { error: deptError } = await supabase
    .from('hr.departments')
    .upsert([
      { name: 'Human Resources', description: 'Human Resources Department' },
      { name: 'Information Technology', description: 'IT Department' },
      { name: 'Finance', description: 'Finance and Accounting Department' },
      { name: 'Operations', description: 'Operations Department' },
      { name: 'Sales', description: 'Sales and Marketing Department' },
      { name: 'Customer Service', description: 'Customer Service Department' }
    ], { onConflict: 'name' });

  if (deptError) {
    console.log(`   ⚠️  Failed to insert departments: ${deptError.message}`);
  } else {
    console.log('   ✅ Sample departments inserted');
  }

  // Insert sample document templates if they don't exist
  const templates = [
    {
      key: 'employment_contract_en',
      display_name: 'Employment Contract (English)',
      language: 'en',
      category: 'CONTRACT',
      storage_path: 'employment_contract_en.hbs',
      description: 'Standard employment contract template in English'
    },
    {
      key: 'employment_contract_ar',
      display_name: 'Employment Contract (Arabic)',
      language: 'ar',
      category: 'CONTRACT',
      storage_path: 'employment_contract_ar.hbs',
      description: 'Standard employment contract template in Arabic'
    },
    {
      key: 'offer_letter_en',
      display_name: 'Job Offer Letter (English)',
      language: 'en',
      category: 'LETTER',
      storage_path: 'offer_letter_en.hbs',
      description: 'Job offer letter template in English'
    },
    {
      key: 'offer_letter_ar',
      display_name: 'Job Offer Letter (Arabic)',
      language: 'ar',
      category: 'LETTER',
      storage_path: 'offer_letter_ar.hbs',
      description: 'Job offer letter template in Arabic'
    }
  ];

  const { error: templateError } = await supabase
    .from('hr.doc_templates')
    .upsert(templates, { onConflict: 'key' });

  if (templateError) {
    console.log(`   ⚠️  Failed to insert templates: ${templateError.message}`);
  } else {
    console.log('   ✅ Sample templates inserted');
  }
}

// Run the setup
setupHRModule();
