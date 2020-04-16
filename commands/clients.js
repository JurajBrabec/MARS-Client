const util = require("util");
const { nbu } = require("../lib/netBackup");

const clients = {
  async read() {
    try {
      await nbu.init();
      const result = await nbu.clients().toDatabase();
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      console.log("Error: " + err.message);
    }
  },
};

module.exports = clients;
