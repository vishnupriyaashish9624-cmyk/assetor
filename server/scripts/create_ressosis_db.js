const { Client } = require('pg');

async function createDb() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: '',   // update if needed
        database: 'postgres',   // connect to default db first
    });

    await client.connect();
    console.log('✅ Connected to postgres (default)');

    try {
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'ressosis_db_server'`);
        if (res.rows.length > 0) {
            console.log('ℹ️  Database ressosis_db_server already exists, skipping creation.');
        } else {
            await client.query('CREATE DATABASE ressosis_db_server');
            console.log('✅ Database ressosis_db_server created successfully!');
        }
    } finally {
        await client.end();
    }
}

createDb().catch(err => {
    console.error('❌ Failed:', err.message);
    process.exit(1);
});
