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
  clients: process.env.CRON_CONFIG,
  policies: process.env.CRON_CONFIG,
  slps: process.env.CRON_CONFIG,
  vaults: process.env.CRON_CONFIG,
  pureDisks: process.env.CRON_CONFIG,
  retLevels: process.env.CRON_CONFIG,
  files: process.env.CRON_DETAILS,
  images: process.env.CRON_DETAILS,
  jobs: process.env.CRON_JOBS,
  allJobs: "* * 12 * * *",
  tickets: process.env.CRON_TICKETS,
  esl: process.env.CRON_ESL,
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
          task = nbu.jobs({ days: 1 });
          break;
        case "allJobs":
          task = nbu.jobs({ days: 7 });
          break;
        case "files":
          task = nbu.files({ all: true, concurrency: 10 });
          break;
        case "images":
          task = nbu.images({ all: true, concurrency: 10 });
          break;
        case "tickets":
          task = nbu.tickets();
          break;
        case "esl":
          task = nbu.esl();
          break;
      }
      if (cmd.list) {
        const line = `${task.title} ${
          inSec ? cli.blue(atDate.from(startTime)) : cli.white.bold("now")
        } (at ${atDate.format("H:mm")})`;
        cli.println(line);
      }
      if (cmd.list || inSec > 0) continue;
      await exec.execute(task);
    }
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    cli.print(cli.red("Error: " + err.message));
  }
}
