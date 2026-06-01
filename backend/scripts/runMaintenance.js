const connectDB = require('../config/db');
const { runDatabaseMaintenance } = require('../config/db');

(async () => {
  await connectDB();
  await runDatabaseMaintenance();
  process.exit();
})();