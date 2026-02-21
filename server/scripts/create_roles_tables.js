const db = require('../config/db');

async function createRolesTables() {
    try {
        console.log('Creating roles table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
                role_name VARCHAR(100) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(company_id, role_name)
            )
        `);

        console.log('Creating role_permissions table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS role_permissions (
                id SERIAL PRIMARY KEY,
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                module_name VARCHAR(100) NOT NULL,
                can_view BOOLEAN DEFAULT FALSE,
                can_create BOOLEAN DEFAULT FALSE,
                can_edit BOOLEAN DEFAULT FALSE,
                can_delete BOOLEAN DEFAULT FALSE,
                UNIQUE(role_id, module_name)
            )
        `);

        console.log('Tables created successfully!');
    } catch (err) {
        console.error('Error creating roles tables:', err);
    } finally {
        process.exit();
    }
}

createRolesTables();
