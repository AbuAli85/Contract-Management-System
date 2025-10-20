-- Create products table with bilingual support (if not exists)
-- Note: Table already exists with different structure, so we'll work with existing structure

-- Create locations table with bilingual support
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

-- Add new columns to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS products_en TEXT,
ADD COLUMN IF NOT EXISTS products_ar TEXT,
ADD COLUMN IF NOT EXISTS location_en TEXT,
ADD COLUMN IF NOT EXISTS location_ar TEXT,
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Insert sample products data (using existing table structure)
INSERT INTO products (name_en, name_ar, description_en, description_ar, category_en, category_ar, type, price, currency, unit_en, unit_ar) VALUES
('Software Development', 'تطوير البرمجيات', 'Custom software development services', 'خدمات تطوير البرمجيات المخصصة', 'Technology', 'التكنولوجيا', 'service', 150, 'USD', 'per hour', 'في الساعة'),
('Web Development', 'تطوير المواقع', 'Website and web application development', 'تطوير المواقع والتطبيقات الويب', 'Technology', 'التكنولوجيا', 'service', 120, 'USD', 'per hour', 'في الساعة'),
('Mobile App Development', 'تطوير التطبيقات المحمولة', 'iOS and Android mobile application development', 'تطوير تطبيقات الهواتف المحمولة', 'Technology', 'التكنولوجيا', 'service', 180, 'USD', 'per hour', 'في الساعة'),
('IT Consulting', 'الاستشارات التقنية', 'Information technology consulting services', 'خدمات الاستشارات التقنية', 'Consulting', 'الاستشارات', 'service', 200, 'USD', 'per hour', 'في الساعة'),
('Digital Marketing', 'التسويق الرقمي', 'Digital marketing and advertising services', 'خدمات التسويق والإعلان الرقمي', 'Marketing', 'التسويق', 'service', 100, 'USD', 'per hour', 'في الساعة'),
('Graphic Design', 'التصميم الجرافيكي', 'Graphic design and branding services', 'خدمات التصميم الجرافيكي والعلامة التجارية', 'Design', 'التصميم', 'service', 80, 'USD', 'per hour', 'في الساعة'),
('Content Writing', 'كتابة المحتوى', 'Content creation and copywriting services', 'خدمات إنشاء المحتوى والكتابة الإعلانية', 'Content', 'المحتوى', 'service', 60, 'USD', 'per hour', 'في الساعة'),
('Translation Services', 'خدمات الترجمة', 'Professional translation and localization', 'الترجمة المهنية والتعريب', 'Language', 'اللغة', 'service', 50, 'USD', 'per hour', 'في الساعة'),
('Legal Services', 'الخدمات القانونية', 'Legal consultation and document preparation', 'الاستشارات القانونية وإعداد الوثائق', 'Legal', 'القانون', 'service', 300, 'USD', 'per hour', 'في الساعة'),
('Accounting Services', 'الخدمات المحاسبية', 'Bookkeeping and financial consulting', 'المحاسبة والاستشارات المالية', 'Finance', 'المالية', 'service', 120, 'USD', 'per hour', 'في الساعة')
ON CONFLICT (name_en) DO NOTHING;

-- Insert sample locations data (using existing table structure)
INSERT INTO locations (name_en, name_ar, country_en, country_ar, city_en, city_ar, type, address_en, address_ar) VALUES
('Dubai, UAE', 'دبي، الإمارات العربية المتحدة', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'Dubai', 'دبي', 'office', 'Business Bay, Dubai', 'الخليج التجاري، دبي'),
('Abu Dhabi, UAE', 'أبو ظبي، الإمارات العربية المتحدة', 'United Arab Emirates', 'الإمارات العربية المتحدة', 'Abu Dhabi', 'أبو ظبي', 'office', 'Corniche Road, Abu Dhabi', 'طريق الكورنيش، أبو ظبي'),
('Muscat, Oman', 'مسقط، عمان', 'Oman', 'عمان', 'Muscat', 'مسقط', 'office', 'Al Khuwair, Muscat', 'الخور، مسقط'),
('Riyadh, Saudi Arabia', 'الرياض، المملكة العربية السعودية', 'Saudi Arabia', 'المملكة العربية السعودية', 'Riyadh', 'الرياض', 'office', 'King Fahd Road, Riyadh', 'طريق الملك فهد، الرياض'),
('Kuwait City, Kuwait', 'مدينة الكويت، الكويت', 'Kuwait', 'الكويت', 'Kuwait City', 'مدينة الكويت', 'office', 'Salmiya, Kuwait', 'السالمية، الكويت'),
('Doha, Qatar', 'الدوحة، قطر', 'Qatar', 'قطر', 'Doha', 'الدوحة', 'office', 'West Bay, Doha', 'الخليج الغربي، الدوحة'),
('Manama, Bahrain', 'المنامة، البحرين', 'Bahrain', 'البحرين', 'Manama', 'المنامة', 'office', 'Seef District, Manama', 'منطقة السيف، المنامة'),
('Remote Work', 'العمل عن بُعد', 'Global', 'عالمي', 'Remote', 'عن بُعد', 'remote', 'Anywhere', 'أي مكان'),
('London, UK', 'لندن، المملكة المتحدة', 'United Kingdom', 'المملكة المتحدة', 'London', 'لندن', 'office', 'Canary Wharf, London', 'كاناري وارف، لندن'),
('New York, USA', 'نيويورك، الولايات المتحدة', 'United States', 'الولايات المتحدة', 'New York', 'نيويورك', 'office', 'Manhattan, New York', 'مانهاتن، نيويورك')
ON CONFLICT (name_en) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category_en ON products(category_en);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_country_en ON locations(country_en);

-- Enable RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Products are insertable by authenticated users" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Products are updatable by authenticated users" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Products are deletable by authenticated users" ON products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for locations
CREATE POLICY "Locations are viewable by everyone" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Locations are insertable by authenticated users" ON locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Locations are updatable by authenticated users" ON locations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Locations are deletable by authenticated users" ON locations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger for products
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Create updated_at trigger for locations
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();
