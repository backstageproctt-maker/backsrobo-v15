const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function listUsers() {
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query('SELECT id, name, email, "companyId" FROM "Users"');
        console.log('--- LISTA DE USUÁRIOS NO BANCO ---');
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await client.end();
    }
}

listUsers();
