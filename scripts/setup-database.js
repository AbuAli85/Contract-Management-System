const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error(
    'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database schema...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(
            `⏳ Executing statement ${i + 1}/${statements.length}...`
          );
          const { error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            // Continue with other statements
          }
        } catch (err) {
          console.error(
            `❌ Failed to execute statement ${i + 1}:`,
            err.message
          );
        }
      }
    }

    console.log('✅ Database setup completed!');

    // Verify the setup
    console.log('🔍 Verifying setup...');

    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.error('❌ Users table verification failed:', usersError.message);
    } else {
      console.log('✅ Users table is accessible');
    }

    // Check if permissions table exists
    const { data: permissions, error: permissionsError } = await supabase
      .from('permissions')
      .select('count')
      .limit(1);

    if (permissionsError) {
      console.error(
        '❌ Permissions table verification failed:',
        permissionsError.message
      );
    } else {
      console.log('✅ Permissions table is accessible');
    }

    // Check if admin user exists
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('email, role, permissions')
      .eq('email', 'admin@example.com')
      .single();

    if (adminError) {
      console.error('❌ Admin user verification failed:', adminError.message);
    } else {
      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(
        `   Permissions: ${adminUser.permissions.length} permissions`
      );
    }

    console.log('\n🎉 Database setup verification completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development server: pnpm run dev');
    console.log('2. Navigate to: http://localhost:3000/en/dashboard/users');
    console.log(
      '3. Login with admin@example.com (you may need to set up auth)'
    );
    console.log('4. Start managing users and permissions!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function setupDatabaseDirect() {
  try {
    console.log('🚀 Setting up database schema (direct method)...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the entire schema as one statement
    const { error } = await supabase.rpc('exec_sql', { sql: schema });

    if (error) {
      console.error('❌ Schema execution failed:', error.message);

      // Try executing statements one by one
      console.log('🔄 Trying alternative method...');
      await setupDatabase();
    } else {
      console.log('✅ Database setup completed successfully!');
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('🔄 Trying alternative method...');
    await setupDatabase();
  }
}

// Check if we can execute SQL directly
async function checkDatabaseAccess() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('📋 Database tables do not exist. Creating schema...');
      await setupDatabaseDirect();
    } else if (error) {
      console.error('❌ Database access error:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Database is already set up');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
checkDatabaseAccess();
