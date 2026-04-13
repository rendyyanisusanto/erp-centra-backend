require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MIGRATIONS_DIR = path.join(__dirname, 'sql');
const TABLE_NAME = 'schema_migrations';

const getMigrationFiles = () => {
    if (!fs.existsSync(MIGRATIONS_DIR)) return [];
    return fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql') && !f.endsWith('.rollback.sql'))
        .sort();
};

const createConnection = async () => mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true,
});

const ensureMigrationsTable = async (conn) => {
    await conn.execute(`
        CREATE TABLE IF NOT EXISTS \`${TABLE_NAME}\` (
            id INT NOT NULL AUTO_INCREMENT,
            filename VARCHAR(255) NOT NULL,
            executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_schema_migrations_filename (filename)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
};

const getExecutedFiles = async (conn) => {
    const [rows] = await conn.execute(`SELECT filename FROM \`${TABLE_NAME}\``);
    return new Set(rows.map((r) => r.filename));
};

const run = async () => {
    const files = getMigrationFiles();
    if (files.length === 0) {
        console.log('No migration files found in /sql.');
        return;
    }

    const conn = await createConnection();
    try {
        await ensureMigrationsTable(conn);
        const executed = await getExecutedFiles(conn);
        const pending = files.filter((f) => !executed.has(f));

        if (pending.length === 0) {
            console.log('No pending migrations.');
            return;
        }

        console.log(`Found ${pending.length} pending migration(s).`);

        for (const file of pending) {
            const fullPath = path.join(MIGRATIONS_DIR, file);
            const sql = fs.readFileSync(fullPath, 'utf8').trim();
            if (!sql) {
                console.log(`Skipping empty migration: ${file}`);
                await conn.execute(`INSERT INTO \`${TABLE_NAME}\` (filename) VALUES (?)`, [file]);
                continue;
            }

            console.log(`Running: ${file}`);
            await conn.query(sql);
            await conn.execute(`INSERT INTO \`${TABLE_NAME}\` (filename) VALUES (?)`, [file]);
            console.log(`Applied: ${file}`);
        }

        console.log('All pending migrations applied successfully.');
    } finally {
        await conn.end();
    }
};

run().catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
