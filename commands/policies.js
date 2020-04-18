const util = require("util");
const { nbu } = require("../lib/netBackup");

const policies = {
  async read() {
    try {
      await nbu.init();
      const { pool } = require("../lib/Database");
      const result = await nbu.policies().toDatabase(pool);
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      console.log("Error: " + err.message);
    } finally {
      await pool.end();
    }
  },
};

module.exports = policies;

async function test() {
  try {
    await nbu.init();
    const { pool } = require("../lib/Database");
    const result = await nbu.jobs().asObjects(2);
    console.log(util.inspect(result, false, null, true));
  } catch (err) {
    console.log("Error: " + err.message);
  } finally {
    await pool.end();
  }
}

//test();
