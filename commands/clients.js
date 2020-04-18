const util = require("util");
const { nbu } = require("../lib/netBackup");
const { pool } = require("../lib/Database");

const clients = {
  async read() {
    try {
      await nbu.init();
      const result = await nbu.clients().toDatabase(pool);
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      console.log("Error: " + err.message);
    } finally {
      await pool.end();
    }
  },
};

module.exports = clients;
