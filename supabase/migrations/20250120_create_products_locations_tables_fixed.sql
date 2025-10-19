-- Create products and locations tables for general contract system
-- These tables support product/service information and location data with Arabic and English support

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean migration)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en TEXT NOT NULL,
    name_ar TEXT,
    description_en TEXT,
    description_ar TEXT,
    category_en TEXT,
    category_ar TEXT,
    type TEXT CHECK (type IN ('product', 'service', 'software', 'consulting', 'maintenance', 'other')),
    price DECIMAL(12,2),
    currency TEXT DEFAULT 'USD',
    unit_en TEXT, -- e.g., 'per hour', 'per unit', 'per project'
    unit_ar TEXT, -- e.g., 'في الساعة', 'لكل وحدة', 'لكل مشروع'
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    specifications JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en TEXT NOT NULL,
    name_ar TEXT,
    type TEXT CHECK (type IN ('office', 'warehouse', 'factory', 'retail', 'remote', 'client_site', 'other')),
    address_en TEXT,
    address_ar TEXT,
    city_en TEXT,
    city_ar TEXT,
    state_en TEXT,
    state_ar TEXT,
    country_en TEXT,
    country_ar TEXT,
    postal_code TEXT,
    coordinates JSONB, -- {"lat": 0.0, "lng": 0.0}
    contact_person_en TEXT,
    contact_person_ar TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    capacity INTEGER,
    amenities JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_products_name_en ON products(name_en);
CREATE INDEX idx_products_name_ar ON products(name_ar);
CREATE INDEX idx_products_category_en ON products(category_en);
CREATE INDEX idx_products_category_ar ON products(category_ar);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_status ON products(status);

CREATE INDEX idx_locations_name_en ON locations(name_en);
CREATE INDEX idx_locations_name_ar ON locations(name_ar);
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_city_en ON locations(city_en);
CREATE INDEX idx_locations_city_ar ON locations(city_ar);
CREATE INDEX idx_locations_country_en ON locations(country_en);
CREATE INDEX idx_locations_country_ar ON locations(country_ar);
CREATE INDEX idx_locations_status ON locations(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for products
CREATE POLICY "Enable read access for all users" ON products
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON products
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for locations
CREATE POLICY "Enable read access for all users" ON locations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON locations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON locations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE products IS 'Products and services catalog for contract generation';
COMMENT ON TABLE locations IS 'Locations and facilities for contract generation';

COMMENT ON COLUMN products.name_en IS 'Product name in English';
COMMENT ON COLUMN products.name_ar IS 'Product name in Arabic';
COMMENT ON COLUMN products.description_en IS 'Product description in English';
COMMENT ON COLUMN products.description_ar IS 'Product description in Arabic';
COMMENT ON COLUMN products.category_en IS 'Product category in English';
COMMENT ON COLUMN products.category_ar IS 'Product category in Arabic';
COMMENT ON COLUMN products.type IS 'Type of product/service: product, service, software, consulting, maintenance, other';
COMMENT ON COLUMN products.unit_en IS 'Unit of measurement in English: per hour, per unit, per project, etc.';
COMMENT ON COLUMN products.unit_ar IS 'Unit of measurement in Arabic: في الساعة، لكل وحدة، لكل مشروع، إلخ';
COMMENT ON COLUMN products.specifications IS 'Product specifications and technical details';

COMMENT ON COLUMN locations.name_en IS 'Location name in English';
COMMENT ON COLUMN locations.name_ar IS 'Location name in Arabic';
COMMENT ON COLUMN locations.address_en IS 'Address in English';
COMMENT ON COLUMN locations.address_ar IS 'Address in Arabic';
COMMENT ON COLUMN locations.city_en IS 'City name in English';
COMMENT ON COLUMN locations.city_ar IS 'City name in Arabic';
COMMENT ON COLUMN locations.country_en IS 'Country name in English';
COMMENT ON COLUMN locations.country_ar IS 'Country name in Arabic';
COMMENT ON COLUMN locations.contact_person_en IS 'Contact person name in English';
COMMENT ON COLUMN locations.contact_person_ar IS 'Contact person name in Arabic';
COMMENT ON COLUMN locations.type IS 'Type of location: office, warehouse, factory, retail, remote, client_site, other';
COMMENT ON COLUMN locations.coordinates IS 'Geographic coordinates as JSON: {"lat": 0.0, "lng": 0.0}';
COMMENT ON COLUMN locations.amenities IS 'Available amenities as JSON array';

-- Insert sample data with Arabic and English
INSERT INTO products (name_en, name_ar, description_en, description_ar, category_en, category_ar, type, price, unit_en, unit_ar) VALUES
('Web Development', 'تطوير المواقع الإلكترونية', 'Custom web application development', 'تطوير تطبيقات الويب المخصصة', 'Technology', 'التكنولوجيا', 'service', 150.00, 'per hour', 'في الساعة'),
('Consulting Services', 'خدمات الاستشارات', 'Business consulting and advisory services', 'خدمات الاستشارات التجارية والإرشادية', 'Consulting', 'الاستشارات', 'consulting', 200.00, 'per hour', 'في الساعة'),
('Software License', 'رخصة البرمجيات', 'Annual software license subscription', 'اشتراك رخصة البرمجيات السنوية', 'Software', 'البرمجيات', 'software', 5000.00, 'per year', 'في السنة'),
('Maintenance Contract', 'عقد الصيانة', 'Ongoing system maintenance and support', 'صيانة ودعم النظام المستمر', 'Support', 'الدعم', 'maintenance', 1000.00, 'per month', 'في الشهر');

INSERT INTO locations (name_en, name_ar, type, address_en, address_ar, city_en, city_ar, country_en, country_ar, contact_person_en, contact_person_ar, contact_phone) VALUES
('Main Office', 'المكتب الرئيسي', 'office', '123 Business Street', 'شارع الأعمال 123', 'Dubai', 'دبي', 'UAE', 'الإمارات العربية المتحدة', 'John Smith', 'جون سميث', '+971-50-123-4567'),
('Warehouse Facility', 'منشأة المستودع', 'warehouse', '456 Industrial Road', 'الطريق الصناعي 456', 'Abu Dhabi', 'أبو ظبي', 'UAE', 'الإمارات العربية المتحدة', 'Sarah Johnson', 'سارة جونسون', '+971-50-987-6543'),
('Client Site - Downtown', 'موقع العميل - وسط المدينة', 'client_site', '789 Downtown Plaza', 'ساحة وسط المدينة 789', 'Dubai', 'دبي', 'UAE', 'الإمارات العربية المتحدة', 'Ahmed Al-Rashid', 'أحمد الراشد', '+971-50-555-1234'),
('Remote Work', 'العمل عن بُعد', 'remote', 'Virtual Location', 'موقع افتراضي', 'Global', 'عالمي', 'Global', 'عالمي', 'Remote Team', 'فريق العمل عن بُعد', 'N/A');
