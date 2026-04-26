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
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'CampaignShippings';
    `);
    console.log('--- TABELAS ENCONTRADAS ---');
    console.log(results);
    process.exit(0);
  } catch (err) {
    console.error('ERRO:', err.message);
    process.exit(1);
  }
}

run();
