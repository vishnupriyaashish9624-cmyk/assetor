const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || 5432, 10),
    max: 20,
});

const convertPlaceholders = (sql) => {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
};

const db = {
    execute: async (sql, params = []) => {
        const client = await pool.connect();
        try {
            const pgSql = convertPlaceholders(sql);
            const res = await client.query(pgSql, params);
            if (res.command === 'SELECT') return [res.rows, res.fields];
            return [{
                affectedRows: res.rowCount,
                insertId: res.rows?.[0]?.id || null
            }, res.fields];
        } finally {
            client.release();
        }
    },
    getConnection: async () => {
        const client = await pool.connect();
        client.execute = async (sql, params = []) => {
            const pgSql = convertPlaceholders(sql);
            const res = await client.query(pgSql, params);
            if (res.command === 'SELECT') return [res.rows, res.fields];
            return [{
                affectedRows: res.rowCount,
                insertId: res.rows?.[0]?.id || null
            }, res.fields];
        };
        client.beginTransaction = () => client.query('BEGIN');
        client.commit = () => client.query('COMMIT');
        client.rollback = () => client.query('ROLLBACK');
        return client;
    }
};

module.exports = db;
