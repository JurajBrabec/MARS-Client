const util = require("util");
const { nbu } = require("../lib/NetBackup");

const summary = {
  async read() {
    try {
      await nbu.init();
      const result = await nbu.summary().toDatabase();
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      console.log("Error: " + err.message);
    }
  },
};

module.exports = summary;
