const fs = require('fs');

const localSchema = fs.readFileSync('local_schema.sql', 'utf8');
const remoteSchema = fs.readFileSync('remote_schema.sql', 'utf8');

// Helper to get statements
function getStatements(sql) {
    // Split by semicolon, but be careful about stored procedures/functions.
    // However, pg_dump uses standard SQL, usually safe to split by `;\n`.
    // We can just regex split.
    return sql.split(/;\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
}

const localStatements = getStatements(localSchema);

// Parse table definitions to find diffs
function parseTables(schema) {
    const tables = {};
    const tableRegex = /CREATE TABLE public\.([a-zA-Z0-9_]+) \(([\s\S]*?)\);/g;
    let match;
    while ((match = tableRegex.exec(schema)) !== null) {
        const tableName = match[1];
        const columnsBlock = match[2];
        const columns = {};

        let current = '';
        let depth = 0;
        const colDefinitions = [];

        for (let i = 0; i < columnsBlock.length; i++) {
            const char = columnsBlock[i];
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (char === ',' && depth === 0) {
                if (current.trim()) colDefinitions.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        if (current.trim()) colDefinitions.push(current.trim());

        colDefinitions.forEach(def => {
            const parts = def.trim().split(/\s+/);
            let colName = parts[0];
            if (colName.startsWith('"') && colName.endsWith('"')) {
                colName = colName.slice(1, -1);
            }
            columns[colName] = def.trim();
        });

        tables[tableName] = { columns };
    }
    return tables;
}

const localTables = parseTables(localSchema);
const remoteTables = parseTables(remoteSchema);

const migrationScript = [];
const newTables = new Set();

// 1. Identify New Tables and New Columns
for (const [tableName, tableData] of Object.entries(localTables)) {
    if (!remoteTables[tableName]) {
        console.log(`-- Table ${tableName} is new.`);
        newTables.add(tableName);
    } else {
        const remoteCols = remoteTables[tableName].columns;
        for (const [colName, colDef] of Object.entries(tableData.columns)) {
            if (!remoteCols[colName]) {
                console.log(`-- Column ${colName} missing in ${tableName}, adding...`);
                // Basic type extraction
                // Clean up output to avoid double quoting issues if present.
                migrationScript.push(`ALTER TABLE public.${tableName} ADD COLUMN ${colDef};`);
            }
        }
    }
}

// 2. Extract SQL for New Tables
if (newTables.size > 0) {
    console.log(`-- Extracting full SQL for new tables: ${Array.from(newTables).join(', ')}`);

    localStatements.forEach(stmt => {
        // Check if statement references any new table
        // We look for strict matches: "public.tablename", "public.tablename ", etc.
        // Also sequences associated with them "tablename_colname_seq" (common pg convention).
        let relevant = false;

        for (const table of newTables) {
            if (stmt.includes(`public.${table}`)) {
                relevant = true;
                break;
            }
            // Check for sequence standard naming
            // table_column_seq
            // We blindly include statements with table name?
            // "vehicles" -> includes "vehicles", "vehicle_module_details" (substring match!)
            // We should be careful. "public.vehicles" is safer.
            // Also sequence: "vehicles_pkey", "vehicles_vehicle_id_seq".
            if (stmt.includes(table)) {
                // heuristic: usually safe for explicit migration file generation purpose
                relevant = true;
                break;
            }
        }

        if (relevant) {
            // Check if it's already in migrationScript (unlikely)
            // But we should exclude CREATE TABLE if we already added it? 
            // No, we haven't added it yet in this loop.
            migrationScript.push(stmt + ';');
        }
    });
}

const finalSql = migrationScript.join('\n\n');
console.log('-- Migration Script Generated --');
// console.log(finalSql);

fs.writeFileSync('generated_migration.sql', finalSql);
