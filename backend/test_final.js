const { Client } = require('pg');
// Usando a senha codificada M%40eeuteamo12
const connectionString = 'postgresql://postgres.apyylvxjfbmcnrtlovnc:M%40eeuteamo12@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  console.log('Tentativa final no Supabase Pooler...');
  try {
    await client.connect();
    console.log('CONECTADO COM SUCESSO! 🎉');
    const res = await client.query('SELECT NOW()');
    console.log('Hora no servidor:', res.rows[0].now);
  } catch (err) {
    console.error('ERRO AINDA PERSISTE:', err.message);
    if (err.message.includes('Tenant or user not found')) {
      console.log('DICA: O Supabase não está reconhecendo o usuário. Verifique se o Project ID (apyylvxjfbmcnrtlovnc) está correto ou se a senha foi alterada.');
    }
  } finally {
    await client.end();
  }
}

test();
