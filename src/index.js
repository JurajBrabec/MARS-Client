const dotenv = require("dotenv").config();
var debug = require("debug")("app");
const commander = require("commander");
const chalk = require("chalk");
const { netBackup } = require("./netBackup");
const { pool } = require("./db");

commander
  .version("v0.0.1")
  .description("This is a dummy demo CLI.")
  .option("-d, --debug", "Debug mode")
  .option("-n, --aname <type>", "To input a name")
  .option("demo", "To output demo")
  .parse(process.argv);

console.log(chalk.red("TEST " + process.version));
if (commander.aname) console.log(`Your name is ${commander.aname}.`);
if (commander.debug) console.log(`Debug mode.`);

debug("start");

async function runMe() {
  try {
    const nbu = await netBackup("D:/Veritas/NetBackup");
    let res;
    console.log(nbu.masterServer);
    res = await nbu.summary().toDatabase(pool, 1);
    console.log("Results:");
    console.log(res);
    res = await nbu.jobs().toDatabase(pool, 100);
    console.log("Results:");
    console.log(res);
    res = await nbu.slps().toDatabase(pool, 100);
    console.log("Results:");
    console.log(res);
    res = await nbu.clients().toDatabase(pool, 100);
    console.log("Results:");
    console.log(res);
  } catch (err) {
    console.log("ERROR:");
    console.log(err);
  } finally {
    await pool.end();
    console.log("Pool closed");
  }
}

runMe();
