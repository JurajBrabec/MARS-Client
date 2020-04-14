const util = require("util");
const { nbu } = require("../lib/NetBackup");

const slps = {
  async read() {
    try {
      await nbu.init();
      const result = await nbu.slps().toDatabase();
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      console.log("Error: " + err.message);
    }
  },
};

module.exports = slps;
