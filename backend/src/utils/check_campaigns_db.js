const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUri = `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
const sequelize = new Sequelize(dbUri, {
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function run() {
  try {
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'Campaigns';
    `);
    console.log('--- COLUNAS REAIS NO BANCO ---');
    console.log(results.map(r => r.column_name).sort().join(', '));
    process.exit(0);
  } catch (err) {
    console.error('ERRO:', err.message);
    process.exit(1);
  }
}

run();
