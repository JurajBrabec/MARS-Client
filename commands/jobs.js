const util = require("util");
const { nbu } = require("../lib/NetBackup");

const jobs = {
  async read(days) {
    try {
      await nbu.init();
      const result = await nbu.jobs(days).toDatabase();
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      console.log("Error: " + err.message);
    }
  },
};

module.exports = jobs;
