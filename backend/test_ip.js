const { Client } = require('pg');
const connectionString = 'postgresql://postgres.apyylvxjfbmcnrtlovnc:M@eeuteamo12@44.216.29.125:6543/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  console.log('Connecting via IPv4 Pooler...');
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
