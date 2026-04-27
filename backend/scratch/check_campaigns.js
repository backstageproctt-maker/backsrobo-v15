const { Sequelize, Op } = require('sequelize');
const moment = require('moment');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function checkCampaigns() {
  try {
    const campaigns = await sequelize.query(
      "SELECT id, name, status, \"scheduledAt\" FROM \"Campaigns\" WHERE status = 'PROGRAMADA' ORDER BY \"scheduledAt\" ASC",
      { type: Sequelize.QueryTypes.SELECT }
    );
    console.log("=== CAMPANHAS PROGRAMADAS ===");
    console.log(`Encontradas: ${campaigns.length}`);
    campaigns.forEach(c => {
      console.log(`ID: ${c.id} | Nome: ${c.name} | Status: ${c.status} | ScheduledAt: ${c.scheduledAt} (UTC)`);
    });

    const now = moment();
    console.log("\n=== CONTEXTO ATUAL ===");
    console.log(`Agora (Local): ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`Agora (UTC):   ${now.utc().format('YYYY-MM-DD HH:mm:ss')}`);
    
    const rangeStart = moment().subtract(24, 'hours').toDate();
    const rangeEnd = moment().add(7, 'days').toDate();
    console.log(`Range Start: ${rangeStart.toISOString()}`);
    console.log(`Range End:   ${rangeEnd.toISOString()}`);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

checkCampaigns();
