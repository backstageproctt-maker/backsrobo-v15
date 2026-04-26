const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixUser() {
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
        // Atualiza nome, perfil e garante que é super admin
        const res = await client.query(
            'UPDATE "Users" SET name = $1, profile = $2, super = $3 WHERE email = $4', 
            ['Mario', 'admin', true, 'mariooliveira.ctt@gmail.com']
        );
        
        if (res.rowCount > 0) {
            console.log('✅ Nome corrigido para Mario e perfil definido como Admin!');
        } else {
            console.log('❌ Usuário não encontrado.');
        }
    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await client.end();
    }
}

fixUser();
