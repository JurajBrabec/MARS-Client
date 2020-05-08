const { nbu } = require("../lib/netBackup");

async function test() {
  const util = require("util");
  const { Database } = require("../lib/Database");
  const database = new Database();
  try {
    console.log(await database.test());
    await nbu.init();
    const source = nbu.vaults();
    console.log(await source.test());
    source.on("progress", console.log);
    //const result = await source.asObjects();
    const result = await source.toDatabase(database);
    console.log(util.inspect(result, false, null, true));
    console.log(util.inspect(source.status, false, null, true));
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    console.log("Error: " + err.message);
  } finally {
    await database.pool.end();
  }
}

if (require.main === module) test();
