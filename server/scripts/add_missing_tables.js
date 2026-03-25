/**
 * add_missing_tables.js
 * Adds the 5 missing tables to ressosis_db_server:
 *   - roles
 *   - role_permissions
 *   - smtp_configs
 *   - status_master
 *   - vehicle_usage
 */
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'ressosis_db_server',
});

const SQL = `

-- ─────────────────────────────────────────────────────────────
-- roles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- role_permissions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
    module_name VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_approve BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────────────────────────
-- smtp_configs
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- status_master
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.status_master (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- vehicle_usage
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicle_usage (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

`;

async function migrate() {
    const client = await pool.connect();
    console.log('✅ Connected to ressosis_db_server');
    try {
        await client.query('BEGIN');
        console.log('⏳ Adding missing tables...\n');
        await client.query(SQL);
        await client.query('COMMIT');

        // Verify final count
        const res = await client.query(`
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        console.log(`\n✅ Done! ressosis_db_server now has ${res.rows.length} tables:`);
        res.rows.forEach((r, i) => console.log(`  ${i + 1}. ${r.table_name}`));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('\n❌ FAILED:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
