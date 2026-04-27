require('dotenv').config();

const app = require('./app');
const { pool } = require('./config/db');

const port = Number(process.env.PORT || 4000);

async function start() {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => {
      console.log(`MediRDV API démarrée sur http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Impossible de démarrer l'API :", error.message);
    process.exit(1);
  }
}

start();
