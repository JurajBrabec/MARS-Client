const dotenv = require("dotenv").config();
var debug = require("debug")("app");
const commander = require("commander");
const chalk = require("chalk");
const { netBackup } = require("./netBackup");
const { createConnection } = require("./db");

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
    const connection = await createConnection();
    try {
      const nbu = await netBackup(process.env.NBU_HOME);
      console.log(chalk.blue(`Master Server: ${nbu.masterServer}`));
      let res = await nbu.summary().toDatabase(connection, 1);
      console.log(res);
      res = await nbu.jobs().toDatabase(connection, 50);
      console.log(res);
      res = await nbu.slps().toDatabase(connection, 50);
      console.log(res);
    } catch (err) {
      debug(`error`);
      console.log("App error:");
      console.error(err);
    } finally {
      await connection.end();
      console.log("Connection closed");
      debug(`closed`);
    }
  } catch (err) {
    console.log("Connection error:");
    console.error(err);
  }
}

runMe();
