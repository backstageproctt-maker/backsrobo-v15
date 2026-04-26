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
    const [whatsapps] = await sequelize.query('SELECT id, name FROM "Whatsapps" WHERE id = 1;');
    const [contactLists] = await sequelize.query('SELECT id, name FROM "ContactLists" WHERE id = 1;');
    
    console.log('--- VERIFICAÇÃO DE VÍNCULOS ---');
    console.log('WhatsApp ID 1:', whatsapps);
    console.log('ContactList ID 1:', contactLists);
    process.exit(0);
  } catch (err) {
    console.error('ERRO AO BUSCAR VÍNCULOS:', err.message);
    process.exit(1);
  }
}

run();
