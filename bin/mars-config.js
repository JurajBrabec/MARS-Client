const program = require("commander");
const cli = require("pixl-cli");

program
  .command("scheduler")
  .description("Configure scheduled task")
  .option("-t,--task <name>", "scheduled task name", "MARS-client")
  .option("-p,--periodicity <minutes>", "scheduler execution periodicity", 5)
  .option("-i,--install", "install scheduled task")
  .option("-u,--uninstall", "uninstall scheduled task")
  .action(configTask);
program
  .command("database")
  .description("Configure database server")
  .option("-s,--server <FQDN>", "Database server FQDN")
  .option("-p,--port <port>", "Database server port", 3306)
  .action(configDatabase);
program.parse(process.argv);

function configTask(cmd) {
  if (cmd.uninstall) {
    cli.print(`Uninstalling scheduled task ${cmd.task}`);
  }
  if (cmd.install) {
    cli.print(
      `Installing scheduled task ${cmd.task} with periodicity ${cmd.periodicity}`
    );
  }
}

function configDatabase(cmd) {
  ini = require("multi-ini");
  const file = "config.ini";
  content = ini.read(file);
  content.section.key = value;
  ini.write(file, content);
}
