const { Client } = require('pg');
require('dotenv').config();

const localConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || 5432, 10),
};

const remoteUrl = 'postgresql://ressoxis_db:jW6CeNvNiyAFUXtUoERGqQRjh8ryIMCW@dpg-d62vtoshg0os73eurrgg-a.oregon-postgres.render.com/ressoxis_db';

async function getSchema(client, name) {
    console.log(`Fetching schema for ${name}...`);
    const tables = {};

    const tableRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);

    for (const row of tableRes.rows) {
        const tableName = row.table_name;
        const colRes = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = $1 AND table_schema = 'public'
        `, [tableName]);

        tables[tableName] = colRes.rows.reduce((acc, col) => {
            acc[col.column_name] = { type: col.data_type, nullable: col.is_nullable };
            return acc;
        }, {});
    }
    return tables;
}

async function run() {
    const local = new Client(localConfig);
    const remote = new Client({ connectionString: remoteUrl, ssl: { rejectUnauthorized: false } });

    try {
        await local.connect();
        await remote.connect();

        const localSchema = await getSchema(local, 'LocalDB');
        const remoteSchema = await getSchema(remote, 'RemoteDB');

        const allTables = new Set([...Object.keys(localSchema), ...Object.keys(remoteSchema)]);

        console.log('\n=========================================');
        console.log('         DATABASE COMPARISON             ');
        console.log('=========================================\n');

        for (const table of Array.from(allTables).sort()) {
            if (!remoteSchema[table]) {
                console.log(`[!] Table '${table}' exists in LOCAL but is MISSING in REMOTE.`);
                continue;
            }
            if (!localSchema[table]) {
                console.log(`[!] Table '${table}' exists in REMOTE but is MISSING in LOCAL.`);
                continue;
            }

            const localCols = localSchema[table];
            const remoteCols = remoteSchema[table];
            const allCols = new Set([...Object.keys(localCols), ...Object.keys(remoteCols)]);

            let tableDiff = [];
            for (const col of Array.from(allCols).sort()) {
                if (!remoteCols[col]) {
                    tableDiff.push(`    - Column '${col}' missing in REMOTE`);
                } else if (!localCols[col]) {
                    tableDiff.push(`    - Column '${col}' missing in LOCAL`);
                } else if (localCols[col].type !== remoteCols[col].type) {
                    tableDiff.push(`    - Column '${col}' type mismatch: LOCAL(${localCols[col].type}) vs REMOTE(${remoteCols[col].type})`);
                }
            }

            if (tableDiff.length > 0) {
                console.log(`Table '${table}':`);
                tableDiff.forEach(d => console.log(d));
            }
        }

        console.log('\nComparison complete.');

    } catch (err) {
        console.error('Error during comparison:', err);
    } finally {
        await local.end();
        await remote.end();
    }
}

run();
