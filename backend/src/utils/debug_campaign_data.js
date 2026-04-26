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
      SELECT id, name, status, "whatsappId", "contactListId", "scheduledAt" 
      FROM "Campaigns" 
      LIMIT 5;
    `);
    console.log('--- DADOS DA TABELA Campaigns ---');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('ERRO AO BUSCAR DADOS:', err.message);
    process.exit(1);
  }
}

run();
