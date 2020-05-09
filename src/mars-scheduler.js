const cli = require("pixl-cli");
const commander = require("commander");
const Cron = require("croner");
const moment = require("moment");
const exec = require("./mars-exec");
const { nbu } = require("../lib/netBackup");

const command = new commander.Command("scheduler")
  .description("Scheduler")
  .option("-l,--list", "List scheduled actions")
  .action(scheduler);

module.exports = { command };

var startTime = moment();

const crons = {
  summary: "* */1 * * * *",
  clients: "* 0 */1 * * *",
  policies: "* 0 */1 * * *",
  slps: "* 0 */1 * * *",
  vaults: "* 0 */1 * * *",
  pureDisks: "* 0 10 * * *",
  retLevels: "* 0 12 * * *",
  files: "* 0 */3 * * *",
  images: "* 0 */3 * * *",
  jobs: "* */5 * * * *",
};

async function scheduler(cmd) {
  try {
    await nbu.init();
    for (const taskName in crons) {
      const cron = Cron(crons[taskName]);
      const inSec = Math.floor(cron.msToNext() / 1000);
      const atDate = moment(cron.next());
      let task;
      switch (taskName) {
        case "summary":
          task = nbu.summary();
          break;
        case "clients":
          task = nbu.clients();
          break;
        case "policies":
          task = nbu.policies();
          break;
        case "slps":
          task = nbu.slps();
          break;
        case "vaults":
          task = nbu.vaults();
          break;
        case "pureDisks":
          task = nbu.pureDisks();
          break;
        case "retLevels":
          task = nbu.retLevels();
          break;
        case "jobs":
          task = nbu.jobs({ days: 3 });
          break;
        case "files":
          task = nbu.files({ all: true, concurrency: 10 });
          break;
        case "images":
          task = nbu.images({ all: true, concurrency: 10 });
          break;
      }
      if (cmd.list) {
        cli.print(
          `${task.title} ${
            inSec ? cli.blue(atDate.from(startTime)) : cli.white.bold("now")
          }`
        );
        cli.println(` (at ${atDate.format("H:mm")})`);
      }
      if (cmd.list || inSec > 0) {
        continue;
      }
      await exec.execute(task);
    }
  } catch (err) {
    cli.print("Error: " + err.message);
  }
}
