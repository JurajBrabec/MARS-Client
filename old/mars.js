const cli = require("pixl-cli");
const commander = require("commander");
const pkg = require("./package.json");
const config = require("./src/mars-config");
const exec = require("./src/mars-exec");
const scheduler = require("./src/mars-scheduler");
const test = require("./src/mars-test");

cli.println(cli.box(cli.bold.white(`MARS v${pkg.version}`)));
cli.setLogFile(`./log/${pkg.name}.log`);
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
