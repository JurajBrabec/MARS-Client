const cli = require("pixl-cli");
const { Database } = require("../lib/Database");

function onProgress(progress) {
  cli.progress.update({ amount: progress.done, max: progress.count });
}
function onFinish(status) {
  cli.print(
    `Finished ${cli.green(status.commands)} ${cli.pluralize(
      "command",
      status.commands
    )} in ${cli.getTextFromSeconds(status.duration)}, `
  );
  cli.print(
    `${cli.green(status.sqls)} ${cli.pluralize(
      "SQL",
      status.sqls
    )} in ${cli.getTextFromSeconds(status.sqlDuration)}, `
  );
  cli.print(`(${cli.green(status.rows)} rows, `);
  cli.print(`${cli.green(status.errors)} errors, `);
  cli.println(`${cli.green(status.warnings)} warnings)`);
}
async function read(source) {
  const database = new Database();
  try {
    cli.progress.start({
      exitOnSig: true,
      catchCrash: true,
      unicode: true,
      styles: {
        spinner: ["bold", "white"],
        braces: ["bold", "red"],
        bar: ["gray"],
        pct: ["bold", "white"],
        remain: ["green"],
      },
    });
    source.on("progress", onProgress);
    const result = await source.toDatabase(database);
    onFinish(result);
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    cli.print(cli.red(`Error: ${err.message}`));
  } finally {
    cli.progress.end();
    await database.pool.end();
  }
}
module.exports.read = read;
