const util = require("util");
const { nbu } = require("../lib/NetBackup");

const policies = {
  async read() {
    try {
      await nbu.init();
      const result = await nbu.policies().toDatabase();
      console.log(util.inspect(result, false, null, true));
    } catch (err) {
      console.log("Error: " + err.message);
    }
  },
};

module.exports = policies;

async function test() {
  try {
    await nbu.init();
    const result = await nbu.policies().asObjects(1);
    console.dir(result);
    //    console.log(util.inspect(result, false, null, true));
  } catch (err) {
    console.log("Error: " + err.message);
  }
}

test();
