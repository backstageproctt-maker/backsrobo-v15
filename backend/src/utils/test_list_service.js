const { Sequelize, DataTypes } = require('sequelize');
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

// Mocking models for a quick test
const Campaign = sequelize.define('Campaign', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: DataTypes.STRING,
  status: DataTypes.STRING,
  scheduledAt: DataTypes.DATE,
  companyId: DataTypes.INTEGER,
  whatsappId: DataTypes.INTEGER,
  contactListId: DataTypes.INTEGER
}, { tableName: 'Campaigns' });

const ContactList = sequelize.define('ContactList', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: DataTypes.STRING
}, { tableName: 'ContactLists' });

const Whatsapp = sequelize.define('Whatsapp', {
  id: { type: DataTypes.INTEGER, primaryKey: true },
  name: DataTypes.STRING
}, { tableName: 'Whatsapps' });

Campaign.belongsTo(ContactList, { foreignKey: 'contactListId' });
Campaign.belongsTo(Whatsapp, { foreignKey: 'whatsappId' });

async function run() {
  try {
    console.log('Executando busca de campanhas...');
    const result = await Campaign.findAndCountAll({
      where: { companyId: 1 },
      limit: 20,
      offset: 0,
      order: [["status", "ASC"], ["scheduledAt", "DESC"]],
      include: [
        { model: ContactList },
        { model: Whatsapp, attributes: ["id", "name"] }
      ]
    });
    console.log('Sucesso! Registros encontrados:', result.count);
    process.exit(0);
  } catch (err) {
    console.error('>>> ERRO IDENTIFICADO:', err.message);
    if (err.parent) console.error('>>> DETALHE SQL:', err.parent.message);
    process.exit(1);
  }
}

run();
