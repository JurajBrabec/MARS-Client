const util = require("util");
const { nbu } = require("../lib/netBackup");

const slps = {
  async read() {
    try {
      await nbu.init();
      const { pool } = require("../lib/Database");
      const result = await nbu.slps().toDatabase(pool);
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      if (
        err instanceof SyntaxError ||
        err instanceof ReferenceError ||
        err instanceof TypeError
      )
        throw err;
      console.log("Error: " + err.message);
    } finally {
      await pool.end();
    }
  },
};

module.exports = slps;
