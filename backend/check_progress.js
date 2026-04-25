const { Sequelize } = require('sequelize');
const dbConfig = require('./dist/config/database');

async function check() {
  const sequelize = new Sequelize(dbConfig);
  try {
    const [results] = await sequelize.query('SELECT count(*) FROM "SequelizeMeta"');
    console.log('Migrations applied:', results[0].count);
  } catch (err) {
    console.log('Error or table not created yet:', err.message);
  } finally {
    await sequelize.close();
  }
}

check();
