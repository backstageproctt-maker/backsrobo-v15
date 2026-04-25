const { Client } = require('pg');
const client = new Client({
  host: 'aws-1-us-west-2.pooler.supabase.com',
  user: 'postgres.apyylvxjfbmcnrtlovnc',
  password: 'M@eeuteamo12',
  database: 'postgres',
  port: 6543,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  console.log('Tentativa na região US-WEST-2...');
  try {
    await client.connect();
    console.log('CONECTADO COM SUCESSO! 🎉🎉🎉');
    const res = await client.query('SELECT NOW()');
    console.log('Hora no Oregon:', res.rows[0].now);
  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await client.end();
  }
}

test();
