const cli = require("pixl-cli");
const commander = require("commander");
const moment = require("moment");
const pkg = require("./package.json");
const config = require("./src/mars-config");
const exec = require("./src/mars-exec");
const scheduler = require("./src/mars-scheduler");
const test = require("./src/mars-test");

var startTime = moment();
cli.println(cli.box(cli.bold.white(`MARS v${pkg.version}`)));
cli.setLogFile("./log/mars.log");
const program = new commander.Command();
program
  .version(pkg.version, "-v, --version")
  .description(pkg.description)
  .option("--debug", "debug mode");
program.addCommand(config.command);
program.addCommand(exec.command);
program.addCommand(scheduler.command);
program.addCommand(test.command);
program.parse(process.argv);
