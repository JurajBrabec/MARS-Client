const program = require("commander");
const cli = require("pixl-cli");
const moment = require("moment");
const Cron = require("croner");
const { nbu } = require("../lib/netBackup");
const read = require("../lib/Mars").read;

const crons = {
  summary: "* */1 * * * *",
  policies: "* 0 */1 * * *",
  slps: "* 0 */1 * * *",
  vaults: "* 0 */1 * * *",
  jobs: "* */5 * * * *",
  files: "* 0 */3 * * *",
  images: "* 0 */3 * * *",
};

const startTime = moment();
cli.println(startTime.format("LT"));

async function init() {
  try {
    for (const taskName in crons) {
      const cron = Cron(crons[taskName]);
      const inSec = Math.floor(cron.msToNext() / 1000);
      const atDate = moment(cron.next());
      if (inSec > 0) {
        cli.println(`${taskName} : next run ${atDate.from(startTime)}`);
        continue;
      }
      await nbu.init();
      let task;
      switch (taskName) {
        case "summary":
          task = nbu.summary();
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
        case "jobs":
          task = nbu.jobs({ days: 3 });
          break;
        case "files":
          task = nbu.files({ all: true, concurrency: 10 });
          break;
        case "policies":
          task = nbu.images({ all: true, concurrency: 10 });
          break;
      }
      await read(task);
    }
  } catch (err) {
    cli.print("Error: " + err.message);
  }
}
init();
