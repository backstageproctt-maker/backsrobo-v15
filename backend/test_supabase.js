const { Client } = require('pg');
const client = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  user: 'postgres.apyylvxjfbmcnrtlovnc',
  password: 'M@eeuteamo12',
  database: 'postgres',
  port: 6543,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  console.log('Connecting to Supabase Pooler...');
  try {
    await client.connect();
    console.log('Connected!');
    const res = await client.query('SELECT NOW()');
    console.log('Success:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

test();
