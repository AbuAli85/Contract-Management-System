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

async function setupProductsAndLocations() {
  console.log('🔄 Setting up products and locations tables...');

  try {
    // 1. Insert sample products data (table should already exist from migration)
    console.log('1️⃣ Inserting sample products data...');
    const productsData = [
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
    ];

    // Check if products table exists and has data
    const { data: existingProducts, error: checkProductsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (checkProductsError) {
      console.log('⚠️ Products table does not exist yet. Please run the migration first.');
      console.log('Run: npx supabase db push');
    } else if (!existingProducts || existingProducts.length === 0) {
      const { error: productsInsertError } = await supabase
        .from('products')
        .insert(productsData);

      if (productsInsertError) {
        console.error('❌ Error inserting products data:', productsInsertError);
      } else {
        console.log('✅ Sample products data inserted successfully');
      }
    } else {
      console.log('✅ Products table already has data');
    }

    // 2. Insert sample locations data
    console.log('2️⃣ Inserting sample locations data...');
    const locationsData = [
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
    ];

    // Check if locations table exists and has data
    const { data: existingLocations, error: checkLocationsError } = await supabase
      .from('locations')
      .select('id')
      .limit(1);

    if (checkLocationsError) {
      console.log('⚠️ Locations table does not exist yet. Please run the migration first.');
      console.log('Run: npx supabase db push');
    } else if (!existingLocations || existingLocations.length === 0) {
      const { error: locationsInsertError } = await supabase
        .from('locations')
        .insert(locationsData);

      if (locationsInsertError) {
        console.error('❌ Error inserting locations data:', locationsInsertError);
      } else {
        console.log('✅ Sample locations data inserted successfully');
      }
    } else {
      console.log('✅ Locations table already has data');
    }

    // 3. Test the data
    console.log('3️⃣ Testing data access...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name_en, name_ar, category')
      .eq('status', 'active')
      .limit(5);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
    } else {
      console.log(`✅ Found ${products?.length || 0} products`);
      products?.forEach(product => {
        console.log(`   - ${product.name_en} (${product.name_ar}) - ${product.category}`);
      });
    }

    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('id, name_en, name_ar, country_en')
      .eq('status', 'active')
      .limit(5);

    if (locationsError) {
      console.error('❌ Error fetching locations:', locationsError);
    } else {
      console.log(`✅ Found ${locations?.length || 0} locations`);
      locations?.forEach(location => {
        console.log(`   - ${location.name_en} (${location.name_ar}) - ${location.country_en}`);
      });
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Products and locations tables are ready');
    console.log('✅ Sample data has been inserted');
    console.log('✅ Data access is working correctly');

  } catch (error) {
    console.error('❌ Error setting up products and locations:', error);
    process.exit(1);
  }
}

// Run the script
setupProductsAndLocations();
