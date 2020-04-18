const util = require("util");
const { nbu } = require("../lib/netBackup");
const { pool } = require("../lib/Database");

const jobs = {
  async read(days) {
    try {
      await nbu.init();
      const result = await nbu.jobs(days).toDatabase(pool);
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      console.log("Error: " + err.message);
    } finally {
      await pool.end();
    }
  },
};

module.exports = jobs;
