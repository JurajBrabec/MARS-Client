const dotenv = require("dotenv").config();
var debug = require("debug")("app");
const commander = require("commander");
const chalk = require("chalk");
const { NetBackup } = require("./netBackup");
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

const NBU = new NetBackup(process.env.NBU_HOME);

function runMe() {
  createConnection()
    .then(connection => {
      console.log(chalk.blue(`Master Server: ${NBU.masterServer}`));
      NBU.summary()
        .toDatabase(connection, 1)
        .then(res => {
          console.log(res);
          return NBU.jobs().asObjects();
          //          .toDatabase(connection, 50);
        })
        .then(res => {
          console.log(res.length);
        })
        .then(() => {
          connection.end().then(() => {
            console.log("Connection closed");
          });
        });
    })
    .catch(err => {
      console.error(err);
    });
}

runMe();

console.log(
  "Continuing to do node things while the process runs at the same time..."
);
