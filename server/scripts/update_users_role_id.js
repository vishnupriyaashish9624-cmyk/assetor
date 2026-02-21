const db = require('../config/db');

async function updateUsersTable() {
    try {
        console.log('Adding role_id column to users table...');
        await db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL");
        console.log('Users table updated successfully!');
    } catch (err) {
        console.error('Error updating users table:', err);
    } finally {
        process.exit();
    }
}

updateUsersTable();
