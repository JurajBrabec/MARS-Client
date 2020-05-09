const commander = require("commander");
const cli = require("pixl-cli");

const command = new commander.Command("config").description("Configuration");
command
  .command("db")
  .description("Configure database connection")
  .requiredOption("-s,--server <FQDN>", "Database server FQDN")
  .option("-p,--port <port>", "Database server port", 3306)
  .action(configDatabase);
command
  .command("nbu")
  .description("Configure NetBackup environment")
  .requiredOption("-h,--home <path>", "Path to netBackup installation")
  .option("-v,--vault <path>", "Path to vault.xml file")
  .action(configNbu);
command
  .command("task")
  .description("Configure scheduled task")
  .option("-t,--task <name>", "scheduled task name", "MARS-client")
  .option("-p,--periodicity <minutes>", "scheduler execution periodicity", 5)
  .option("-i,--install", "install scheduled task")
  .option("-u,--uninstall", "uninstall scheduled task")
  .action(configTask);

module.exports = { command };

function configTask(cmd) {
  cli.println(`Config task ${cmd} `);
  cli.println(cmd);
}
function configDatabase(cmd) {
  cli.println(`Config Database ${cmd} `);
  cli.println(cmd);
}
function configNbu(cmd) {
  cli.println(`Config Database ${cmd} `);
  cli.println(cmd);
}
