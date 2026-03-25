/**
 * sync_to_render.js
 * 
 * Safely synchronizes the schema from local software_db to remote Render ressosis_db.
 * Uses CREATE TABLE IF NOT EXISTS and adds missing columns where necessary.
 */

const { Pool } = require('pg');

const remoteUrl = 'postgresql://ressoxis_db:jW6CeNvNiyAFUXtUoERGqQRjh8ryIMCW@dpg-d62vtoshg0os73eurrgg-a.oregon-postgres.render.com/ressoxis_db';

const pool = new Pool({
    connectionString: remoteUrl,
    ssl: { rejectUnauthorized: false }
});

const SCHEMA_SQL = `
-- ─────────────────────────────────────────────────────────────
-- FUNCTION & EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END; $$;

-- ─────────────────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.area (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS public.asset_assignments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    asset_id INTEGER,
    employee_id INTEGER,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    returned_date TIMESTAMP,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER,
    module_name VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.smtp_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 587,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    encryption VARCHAR(10) DEFAULT 'tls',
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    reply_to VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    debug_mode BOOLEAN DEFAULT FALSE,
    company_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.status_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.vehicle_usage (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Ensure updated columns exist in core tables if they were missed
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS force_reset BOOLEAN DEFAULT FALSE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_code VARCHAR(50);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_code VARCHAR(50);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS client_id INTEGER;
`;

// Helper function to add columns from local_schema to remote
// This is a simplified list based on common missing ones
const COLUMN_UPDATES = [
    { table: 'companies', column: 'trade_license', type: 'VARCHAR(100)' },
    { table: 'companies', column: 'tax_no', type: 'VARCHAR(100)' },
    { table: 'companies', column: 'industry', type: 'VARCHAR(100)' },
    { table: 'companies', column: 'logo', type: 'TEXT' },
    { table: 'companies', column: 'can_add_employee', type: 'BOOLEAN DEFAULT TRUE' },
    { table: 'companies', column: 'max_employees', type: 'INTEGER DEFAULT 10' },
    { table: 'companies', column: 'max_assets', type: 'INTEGER DEFAULT 20' },
    { table: 'users', column: 'client_id', type: 'INTEGER' }
];

async function sync() {
    console.log('⏳ Connecting to Render Render database...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log('✅ Connected. Applying schema updates...');

        // 1. Run the core schema additions
        await client.query(SCHEMA_SQL);
        console.log('✅ Core missing tables and base columns added.');

        // 2. Safely add extra columns
        for (const update of COLUMN_UPDATES) {
            try {
                await client.query(`ALTER TABLE public.${update.table} ADD COLUMN IF NOT EXISTS ${update.column} ${update.type}`);
            } catch (colErr) {
                console.warn(`⚠️  Could not add ${update.column} to ${update.table}: ${colErr.message}`);
            }
        }
        console.log('✅ Additional columns synchronized.');

        await client.query('COMMIT');
        console.log('\n🚀 ALL UPDATES APPLIED TO RENDER DATABASE!');

        // Final Status
        const statusRes = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);
        console.log(`📊 Final Table Count on Render: ${statusRes.rows.length}`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Sync FAILED:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

sync();
