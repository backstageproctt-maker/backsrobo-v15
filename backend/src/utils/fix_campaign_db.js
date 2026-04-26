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
    console.log('Adicionando coluna tagListId na tabela Campaigns...');
    await sequelize.query('ALTER TABLE "Campaigns" ADD COLUMN IF NOT EXISTS "tagListId" INTEGER;');
    console.log('Sucesso! Coluna adicionada.');
    process.exit(0);
  } catch (err) {
    console.error('ERRO AO ADICIONAR COLUNA:', err.message);
    process.exit(1);
  }
}

run();
