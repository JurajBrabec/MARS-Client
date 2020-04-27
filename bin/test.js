const { nbu } = require("../lib/netBackup");

async function test() {
  const util = require("util");
  const { database } = require("../lib/Database");
  try {
    await nbu.init();
    const source = nbu.images({ days: 2 });
    source.on("progress", console.log);
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

//if (require.main === module) test();
let a = { a: 1, b: 2, c: 3 };
let b = [...Object.values(a), "4 5 6"].join(" ");
console.log(b);
