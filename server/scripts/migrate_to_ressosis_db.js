/**
 * migrate_to_ressosis_db.js
 * 
 * Safely creates all application tables in ressosis_db_server.
 * Uses CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS — safe to run multiple times.
 * Does NOT drop or alter any existing data.
 */

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',          // <-- update if your local postgres has a password
    database: 'ressosis_db_server',
});

const SQL = `

-- ─────────────────────────────────────────────────────────────
-- FUNCTION
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END; $$;

-- ─────────────────────────────────────────────────────────────
-- LOOKUP TABLES (no FKs — create first)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.area (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS public.countries (
    id SERIAL PRIMARY KEY,
    country_name VARCHAR(100) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_country_name ON public.countries (country_name);

CREATE TABLE IF NOT EXISTS public.property_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS name ON public.property_types (name);

CREATE TABLE IF NOT EXISTS public.premises_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    max_companies INTEGER DEFAULT 5,
    max_employees INTEGER DEFAULT 100,
    max_assets INTEGER DEFAULT 500,
    enabled_modules JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    company_code VARCHAR(50),
    trade_license VARCHAR(100),
    tax_no VARCHAR(100),
    industry VARCHAR(100),
    logo VARCHAR(255),
    tenancy_type VARCHAR(20) DEFAULT 'OWNED',
    landlord_name VARCHAR(255),
    contract_start_date DATE,
    contract_end_date DATE,
    registration_no VARCHAR(100),
    ownership_doc_ref VARCHAR(100),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    area VARCHAR(255),
    address TEXT,
    po_box VARCHAR(50),
    makani_number VARCHAR(100),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    telephone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    support_email VARCHAR(255)
);

DROP TRIGGER IF EXISTS update_clients_modtime ON public.clients;
CREATE TRIGGER update_clients_modtime
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100),
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    client_id INTEGER REFERENCES public.clients(id),
    can_add_employee BOOLEAN DEFAULT TRUE,
    max_employees INTEGER DEFAULT 10,
    max_assets INTEGER DEFAULT 20,
    company_code VARCHAR(50),
    trade_license VARCHAR(100),
    tax_no VARCHAR(100),
    industry VARCHAR(100),
    logo TEXT,
    tenancy_type VARCHAR(20) DEFAULT 'OWNED',
    landlord_name VARCHAR(255),
    contract_start_date DATE,
    contract_end_date DATE,
    registration_no VARCHAR(100),
    ownership_doc_ref VARCHAR(100),
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    area VARCHAR(100),
    address TEXT,
    po_box VARCHAR(50),
    makani_number VARCHAR(100),
    telephone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    enabled_modules JSONB
);
CREATE UNIQUE INDEX IF NOT EXISTS subdomain ON public.companies (subdomain);

-- ─────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    client_id INTEGER,
    force_reset BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────────────────────────
-- DEPARTMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50)
);
CREATE INDEX IF NOT EXISTS department_company_id ON public.departments (company_id);

-- ─────────────────────────────────────────────────────────────
-- EMPLOYEES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.employees (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    department_id INTEGER,
    employee_id_card VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    position VARCHAR(100)
);
CREATE INDEX IF NOT EXISTS department_id ON public.employees (department_id);

-- ─────────────────────────────────────────────────────────────
-- COMPANY DOCUMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_documents (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- ASSET CATEGORIES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.asset_categories (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- ─────────────────────────────────────────────────────────────
-- ASSETS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assets (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES public.asset_categories(id) ON DELETE CASCADE,
    asset_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost NUMERIC,
    status TEXT DEFAULT 'AVAILABLE',
    current_holder_id INTEGER,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS company_id ON public.assets (company_id, asset_code);
CREATE INDEX IF NOT EXISTS company_id_2 ON public.assets (company_id);
CREATE INDEX IF NOT EXISTS category_id ON public.assets (category_id);
CREATE INDEX IF NOT EXISTS current_holder_id ON public.assets (current_holder_id);

-- ─────────────────────────────────────────────────────────────
-- ASSET ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.asset_assignments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    returned_date TIMESTAMP,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS asset_id ON public.asset_assignments (asset_id);
CREATE INDEX IF NOT EXISTS employee_id ON public.asset_assignments (employee_id);

-- ─────────────────────────────────────────────────────────────
-- ASSET REQUESTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.asset_requests (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    category_id INTEGER,
    asset_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'SUBMITTED',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS user_id ON public.audit_logs (user_id);

-- ─────────────────────────────────────────────────────────────
-- MAINTENANCE TICKETS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.maintenance_tickets (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    asset_id INTEGER NOT NULL,
    issue_description TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    priority TEXT DEFAULT 'MEDIUM',
    cost NUMERIC DEFAULT 0.00,
    scheduled_date DATE,
    completion_date DATE,
    performed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- MODULE MASTER (global modules registry)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_master (
    module_id SERIAL PRIMARY KEY,
    module_name VARCHAR(255) NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.modules_master (
    id SERIAL PRIMARY KEY,
    module_key VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100)
);
CREATE UNIQUE INDEX IF NOT EXISTS module_key ON public.modules_master (module_key);

-- ─────────────────────────────────────────────────────────────
-- COMPANY MODULES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.company_modules (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES public.modules_master(id) ON DELETE CASCADE,
    is_enabled INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    country_id INTEGER,
    property_type_id INTEGER,
    premises_type_id INTEGER,
    area_id INTEGER,
    status_id INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS module_id ON public.company_modules (module_id);
CREATE INDEX IF NOT EXISTS idx_company_module_search ON public.company_modules (company_id, module_id);
CREATE INDEX IF NOT EXISTS idx_country_id ON public.company_modules (country_id);
CREATE INDEX IF NOT EXISTS fk_cm_property_type ON public.company_modules (property_type_id);
CREATE INDEX IF NOT EXISTS idx_premises_type_id ON public.company_modules (premises_type_id);
CREATE INDEX IF NOT EXISTS idx_area_id ON public.company_modules (area_id);
CREATE INDEX IF NOT EXISTS idx_status_id ON public.company_modules (status_id);

-- ─────────────────────────────────────────────────────────────
-- MODULE BUILDER (sections, fields, options)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.modules (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    module_key VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.module_sections (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.module_section_fields (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    section_id INTEGER NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    placeholder VARCHAR(255),
    is_required INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS unique_field_key ON public.module_section_fields (company_id, section_id, field_key);
CREATE INDEX IF NOT EXISTS section_id ON public.module_section_fields (section_id);

CREATE TABLE IF NOT EXISTS public.module_section_field_options (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS field_id ON public.module_section_field_options (field_id);

CREATE TABLE IF NOT EXISTS public.company_module_field_selection (
    id SERIAL PRIMARY KEY,
    company_module_id INTEGER NOT NULL,
    field_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cm ON public.company_module_field_selection (company_module_id);
CREATE INDEX IF NOT EXISTS idx_field ON public.company_module_field_selection (field_id);

-- ─────────────────────────────────────────────────────────────
-- MODULE TEMPLATES (heads/subheads)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_templates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    module_id INTEGER NOT NULL,
    template_name VARCHAR(255),
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.module_heads (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL,
    head_title VARCHAR(255) NOT NULL,
    head_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS template_id ON public.module_heads (template_id);

CREATE TABLE IF NOT EXISTS public.module_subheads (
    id SERIAL PRIMARY KEY,
    head_id INTEGER NOT NULL,
    subhead_title VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    placeholder VARCHAR(255),
    is_required INTEGER DEFAULT 0,
    subhead_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS head_id ON public.module_subheads (head_id);

CREATE TABLE IF NOT EXISTS public.module_subhead_options (
    id SERIAL PRIMARY KEY,
    subhead_id INTEGER NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    option_value VARCHAR(255) NOT NULL,
    option_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS subhead_id ON public.module_subhead_options (subhead_id);

-- ─────────────────────────────────────────────────────────────
-- VEHICLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    vehicle_name VARCHAR(255) NOT NULL,
    license_plate VARCHAR(50),
    type VARCHAR(50),
    driver VARCHAR(255),
    vehicle_usage VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    country_id INTEGER,
    property_type_id INTEGER,
    premises_type_id INTEGER,
    area_id INTEGER,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.vehicle_module_details (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    field_key VARCHAR(255) NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vehicle_module_details_vehicle_id_field_key_key UNIQUE (vehicle_id, field_key)
);

-- ─────────────────────────────────────────────────────────────
-- PREMISES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.office_premises (
    premise_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    premise_type TEXT NOT NULL,
    premises_name VARCHAR(255) NOT NULL,
    building_name VARCHAR(255) NOT NULL,
    premises_use TEXT NOT NULL,
    country VARCHAR(100) NOT NULL,
    area_id INTEGER,
    company_module_id INTEGER,
    city VARCHAR(100) NOT NULL,
    full_address TEXT NOT NULL,
    location_notes TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    document_name VARCHAR(255),
    document_path VARCHAR(255),
    document_mime VARCHAR(50),
    google_map_url TEXT,
    capacity INTEGER DEFAULT 0,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    landmark VARCHAR(255),
    location_lat NUMERIC,
    location_lng NUMERIC,
    area_sqft NUMERIC,
    floors INTEGER,
    parking_available INTEGER DEFAULT 0,
    parking_area VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.office_rental_details (
    premise_id INTEGER PRIMARY KEY,
    landlord_name VARCHAR(255) NOT NULL,
    landlord_contact_person VARCHAR(120),
    landlord_phone VARCHAR(50) NOT NULL,
    landlord_email VARCHAR(120),
    contract_start DATE NOT NULL,
    contract_end DATE NOT NULL,
    monthly_rent NUMERIC NOT NULL,
    security_deposit NUMERIC,
    renewal_reminder_date DATE,
    payment_frequency TEXT DEFAULT 'MONTHLY',
    next_payment_date DATE,
    late_fee_terms VARCHAR(255),
    notes TEXT,
    yearly_rent NUMERIC,
    deposit_amount NUMERIC,
    next_due_date DATE,
    lease_start_date DATE,
    lease_end_date DATE,
    rent_amount NUMERIC,
    payment_cycle VARCHAR(50) DEFAULT 'MONTHLY'
);

CREATE TABLE IF NOT EXISTS public.office_owned_details (
    premise_id INTEGER PRIMARY KEY,
    buy_date DATE NOT NULL,
    purchase_value NUMERIC NOT NULL,
    property_size_sqft NUMERIC,
    title_deed_ref VARCHAR(100),
    owner_name VARCHAR(120),
    renewal_required INTEGER DEFAULT 0,
    renewal_date DATE,
    insurance_required INTEGER DEFAULT 0,
    insurance_expiry DATE,
    notes TEXT,
    floors_count INTEGER DEFAULT 0,
    depreciation_rate NUMERIC DEFAULT 0.00,
    electricity_available INTEGER DEFAULT 0,
    water_available INTEGER DEFAULT 0,
    internet_available INTEGER DEFAULT 0,
    ownership_type VARCHAR(50),
    vendor_name VARCHAR(150),
    warranty_end_date DATE,
    property_tax_id VARCHAR(80),
    depreciation_percent NUMERIC
);

CREATE TABLE IF NOT EXISTS public.office_premises_utilities (
    premise_id INTEGER PRIMARY KEY,
    company_id INTEGER NOT NULL,
    electricity_no VARCHAR(80),
    water_no VARCHAR(80),
    internet_provider VARCHAR(120),
    utility_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.office_premise_attachments (
    attachment_id SERIAL PRIMARY KEY,
    premise_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS premise_id ON public.office_premise_attachments (premise_id);

CREATE TABLE IF NOT EXISTS public.office_premises_documents (
    doc_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    premise_id INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.premises_module_details (
    id SERIAL PRIMARY KEY,
    premise_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    field_key VARCHAR(255) NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- SMTP SETTINGS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.smtp_settings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES public.clients(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 587,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    secure BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

`;

async function migrate() {
    const client = await pool.connect();
    console.log('✅ Connected to ressosis_db_server');
    try {
        await client.query('BEGIN');
        console.log('⏳ Running migrations...\n');
        await client.query(SQL);
        await client.query('COMMIT');
        console.log('\n✅ Migration complete! All tables created in ressosis_db_server.');

        // List what was created
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        console.log(`\n📋 Tables in ressosis_db_server (${res.rows.length} total):`);
        res.rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.table_name}`));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ Migration FAILED:', err.message);
        if (err.detail) console.error('   Detail:', err.detail);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
