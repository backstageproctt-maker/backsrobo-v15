const { Client } = require('pg');
// Password with @ encoded as %40
const connectionString = 'postgresql://postgres.apyylvxjfbmcnrtlovnc:M%40eeuteamo12@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  console.log('Connecting via URI with encoded password...');
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
