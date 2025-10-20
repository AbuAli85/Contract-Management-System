const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDatabaseChanges() {
  console.log('🔄 Applying database changes for products and locations...');

  try {
    // 1. Create products table
    console.log('1️⃣ Creating products table...');
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name_en TEXT NOT NULL,
          name_ar TEXT NOT NULL,
          description_en TEXT,
          description_ar TEXT,
          category TEXT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (productsError) {
      console.error('❌ Error creating products table:', productsError);
    } else {
      console.log('✅ Products table created successfully');
    }

    // 2. Create locations table
    console.log('2️⃣ Creating locations table...');
    const { error: locationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS locations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name_en TEXT NOT NULL,
          name_ar TEXT NOT NULL,
          country_en TEXT,
          country_ar TEXT,
          city_en TEXT,
          city_ar TEXT,
          address_en TEXT,
          address_ar TEXT,
          coordinates POINT,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (locationsError) {
      console.error('❌ Error creating locations table:', locationsError);
    } else {
      console.log('✅ Locations table created successfully');
    }

    // 3. Add new columns to contracts table
    console.log('3️⃣ Adding new columns to contracts table...');
    const { error: contractsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE contracts 
        ADD COLUMN IF NOT EXISTS products_en TEXT,
        ADD COLUMN IF NOT EXISTS products_ar TEXT,
        ADD COLUMN IF NOT EXISTS location_en TEXT,
        ADD COLUMN IF NOT EXISTS location_ar TEXT,
        ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
        ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
      `
    });

    if (contractsError) {
      console.error('❌ Error adding columns to contracts table:', contractsError);
    } else {
      console.log('✅ New columns added to contracts table successfully');
    }

    // 4. Insert sample products data
    console.log('4️⃣ Inserting sample products data...');
    const { error: productsInsertError } = await supabase
      .from('products')
      .upsert([
        { name_en: 'Software Development', name_ar: 'تطوير البرمجيات', description_en: 'Custom software development services', description_ar: 'خدمات تطوير البرمجيات المخصصة', category: 'Technology' },
        { name_en: 'Web Development', name_ar: 'تطوير المواقع', description_en: 'Website and web application development', description_ar: 'تطوير المواقع والتطبيقات الويب', category: 'Technology' },
        { name_en: 'Mobile App Development', name_ar: 'تطوير التطبيقات المحمولة', description_en: 'iOS and Android mobile application development', description_ar: 'تطوير تطبيقات الهواتف المحمولة', category: 'Technology' },
        { name_en: 'IT Consulting', name_ar: 'الاستشارات التقنية', description_en: 'Information technology consulting services', description_ar: 'خدمات الاستشارات التقنية', category: 'Consulting' },
        { name_en: 'Digital Marketing', name_ar: 'التسويق الرقمي', description_en: 'Digital marketing and advertising services', description_ar: 'خدمات التسويق والإعلان الرقمي', category: 'Marketing' },
        { name_en: 'Graphic Design', name_ar: 'التصميم الجرافيكي', description_en: 'Graphic design and branding services', description_ar: 'خدمات التصميم الجرافيكي والعلامة التجارية', category: 'Design' },
        { name_en: 'Content Writing', name_ar: 'كتابة المحتوى', description_en: 'Content creation and copywriting services', description_ar: 'خدمات إنشاء المحتوى والكتابة الإعلانية', category: 'Content' },
        { name_en: 'Translation Services', name_ar: 'خدمات الترجمة', description_en: 'Professional translation and localization', description_ar: 'الترجمة المهنية والتعريب', category: 'Language' },
        { name_en: 'Legal Services', name_ar: 'الخدمات القانونية', description_en: 'Legal consultation and document preparation', description_ar: 'الاستشارات القانونية وإعداد الوثائق', category: 'Legal' },
        { name_en: 'Accounting Services', name_ar: 'الخدمات المحاسبية', description_en: 'Bookkeeping and financial consulting', description_ar: 'المحاسبة والاستشارات المالية', category: 'Finance' }
      ], { onConflict: 'name_en' });

    if (productsInsertError) {
      console.error('❌ Error inserting products data:', productsInsertError);
    } else {
      console.log('✅ Sample products data inserted successfully');
    }

    // 5. Insert sample locations data
    console.log('5️⃣ Inserting sample locations data...');
    const { error: locationsInsertError } = await supabase
      .from('locations')
      .upsert([
        { name_en: 'Dubai, UAE', name_ar: 'دبي، الإمارات العربية المتحدة', country_en: 'United Arab Emirates', country_ar: 'الإمارات العربية المتحدة', city_en: 'Dubai', city_ar: 'دبي' },
        { name_en: 'Abu Dhabi, UAE', name_ar: 'أبو ظبي، الإمارات العربية المتحدة', country_en: 'United Arab Emirates', country_ar: 'الإمارات العربية المتحدة', city_en: 'Abu Dhabi', city_ar: 'أبو ظبي' },
        { name_en: 'Muscat, Oman', name_ar: 'مسقط، عمان', country_en: 'Oman', country_ar: 'عمان', city_en: 'Muscat', city_ar: 'مسقط' },
        { name_en: 'Riyadh, Saudi Arabia', name_ar: 'الرياض، المملكة العربية السعودية', country_en: 'Saudi Arabia', country_ar: 'المملكة العربية السعودية', city_en: 'Riyadh', city_ar: 'الرياض' },
        { name_en: 'Kuwait City, Kuwait', name_ar: 'مدينة الكويت، الكويت', country_en: 'Kuwait', country_ar: 'الكويت', city_en: 'Kuwait City', city_ar: 'مدينة الكويت' },
        { name_en: 'Doha, Qatar', name_ar: 'الدوحة، قطر', country_en: 'Qatar', country_ar: 'قطر', city_en: 'Doha', city_ar: 'الدوحة' },
        { name_en: 'Manama, Bahrain', name_ar: 'المنامة، البحرين', country_en: 'Bahrain', country_ar: 'البحرين', city_en: 'Manama', city_ar: 'المنامة' },
        { name_en: 'Remote Work', name_ar: 'العمل عن بُعد', country_en: 'Global', country_ar: 'عالمي', city_en: 'Remote', city_ar: 'عن بُعد' },
        { name_en: 'London, UK', name_ar: 'لندن، المملكة المتحدة', country_en: 'United Kingdom', country_ar: 'المملكة المتحدة', city_en: 'London', city_ar: 'لندن' },
        { name_en: 'New York, USA', name_ar: 'نيويورك، الولايات المتحدة', country_en: 'United States', country_ar: 'الولايات المتحدة', city_en: 'New York', city_ar: 'نيويورك' }
      ], { onConflict: 'name_en' });

    if (locationsInsertError) {
      console.error('❌ Error inserting locations data:', locationsInsertError);
    } else {
      console.log('✅ Sample locations data inserted successfully');
    }

    // 6. Enable RLS and create policies
    console.log('6️⃣ Setting up RLS policies...');
    
    // Enable RLS
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE products ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE locations ENABLE ROW LEVEL SECURITY;' });

    // Create policies for products
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY IF NOT EXISTS "Products are viewable by everyone" ON products FOR SELECT USING (true);` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY IF NOT EXISTS "Products are insertable by authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY IF NOT EXISTS "Products are updatable by authenticated users" ON products FOR UPDATE USING (auth.role() = 'authenticated');` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY IF NOT EXISTS "Products are deletable by authenticated users" ON products FOR DELETE USING (auth.role() = 'authenticated');` 
    });

    // Create policies for locations
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY IF NOT EXISTS "Locations are viewable by everyone" ON locations FOR SELECT USING (true);` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY IF NOT EXISTS "Locations are insertable by authenticated users" ON locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY IF NOT EXISTS "Locations are updatable by authenticated users" ON locations FOR UPDATE USING (auth.role() = 'authenticated');` 
    });
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY IF NOT EXISTS "Locations are deletable by authenticated users" ON locations FOR DELETE USING (auth.role() = 'authenticated');` 
    });

    console.log('✅ RLS policies created successfully');

    // 7. Create indexes
    console.log('7️⃣ Creating indexes...');
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);' });
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);' });
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);' });
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country_en);' });

    console.log('✅ Indexes created successfully');

    console.log('\n🎉 All database changes applied successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Products table created with sample data');
    console.log('✅ Locations table created with sample data');
    console.log('✅ New columns added to contracts table');
    console.log('✅ RLS policies configured');
    console.log('✅ Indexes created for performance');

  } catch (error) {
    console.error('❌ Error applying database changes:', error);
    process.exit(1);
  }
}

// Run the script
applyDatabaseChanges();
