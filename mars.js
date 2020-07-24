const cli = require('pixl-cli');
const commander = require('commander');
const Cron = require('croner');
const dotenv = require('dotenv').config();
const moment = require('moment');
const pkg = require('./package.json');
const { NetBackup } = require('./lib/NetBackup');

const startTime = moment();

const crons = {
  summary: '* */1 * * * *',
  clients: process.env.CRON_CONFIG || '* * */1 * * *',
  policies: process.env.CRON_CONFIG || '* * */1 * * *',
  slps: process.env.CRON_CONFIG || '* * */1 * * *',
  vaults: process.env.CRON_CONFIG || '* * */1 * * *',
  pureDisks: process.env.CRON_CONFIG || '* * */1 * * *',
  retLevels: process.env.CRON_CONFIG || '* * */1 * * *',
  files: process.env.CRON_DETAILS || '* * */4 * * *',
  images: process.env.CRON_DETAILS || '* * */4 * * *',
  jobs: process.env.CRON_JOBS || '* */5 * * * *',
  allImages: '* * 12 * * *',
  allJobs: '* * 12 * * *',
  tickets: process.env.CRON_TICKETS || '* */5 * * * *',
  esl: process.env.CRON_ESL || '* * */4 * * *',
};

cli.println(cli.box(cli.bold.white(`MARS v${pkg.version}`)));
cli.setLogFile(`./log/${pkg.name}.log`);

const netBackup = new NetBackup();
const program = new commander.Command();
program
  .version(pkg.version, '-v, --version')
  .description(pkg.description)
  .option('--debug', 'debug mode');
let command;
command = new commander.Command('exec').description('Execution');
command.command('summary').description('Read summary').action(execSummary);
command.command('clients').description('Read clients').action(execClients);
command.command('policies').description('Read policies').action(execPolicies);
command.command('slps').description("Read SLP's").action(execSlps);
command.command('vaults').description('Read vaults').action(execVaults);
command
  .command('puredisks')
  .description('Read pure disks')
  .action(execPureDisks);
command
  .command('retlevels')
  .description('Read retention levels')
  .action(execRetLevels);
command
  .command('files')
  .description('Read files')
  .option('-a,--all', 'All files to read')
  .option('-c,--client <client>', 'Client to read')
  .option('-i,--backupid <backupId>', 'Backup ID to read')
  .action(execFiles);
command
  .command('images')
  .description('Read images')
  .option('-a,--all', 'All files to read')
  .option('-c,--client <client>', 'Client to read')
  .option('-d,--days <days>', 'Days to read')
  .action(execImages);
command
  .command('jobs')
  .description('Read jobs')
  .option('-a,--all', 'All jobs to read')
  .option('-d,--days <days>', 'Days to read', 1)
  .option('-j,--jobid <jobid>', 'Job ID to read')
  .action(execJobs);
command.command('tickets').description('Write vaults').action(execTickets);
command.command('esl').description('Write ESL information').action(execEsl);
program.addCommand(command);
command = new commander.Command('scheduler')
  .description('Scheduler')
  .option('-l,--list', 'List scheduled actions')
  .action(scheduler);
program.addCommand(command);

program.parse(process.argv);

async function execSummary() {
  cli.println(`Reading summary...`);
  execute(await netBackup.summary());
}

async function execSlps() {
  cli.println(`Reading SLP's...`);
  execute(await netBackup.slps());
}

async function execClients() {
  cli.println(`Reading clients...`);
  execute(await netBackup.clients());
}

async function execPolicies() {
  cli.println(`Reading policies...`);
  execute(await netBackup.policies());
}

async function execRetLevels() {
  cli.println(`Reading retention levels...`);
  execute(await netBackup.retlevels());
}

async function execPureDisks() {
  cli.println(`Reading pure disks...`);
  execute(await netBackup.pureDisks());
}

async function execVaults() {
  cli.println(`Reading vaults...`);
  execute(await netBackup.vaults());
}

async function execJobs(cmd) {
  let args;
  if (cmd.all) delete cmd.days;
  if (cmd.days) args = { daysBack: cmd.days };
  if (cmd.jobid) args = { jobId: cmd.jobid };
  if (cmd.all) args = { all: true };
  if (args) {
    cli.println(
      `Reading${args.all ? ' all ' : ' '}jobs ${
        args.daysBack ? `for ${args.daysBack} days back` : ''
      }...`
    );
    execute(await netBackup.jobs(args));
  } else {
    cli.println(`No argument given.`);
  }
}

async function execFiles(cmd) {
  let args;
  if (cmd.backupid) args = { backupId: cmd.backupid };
  if (cmd.client) args = { client: cmd.client };
  if (cmd.all) args = { all: true };
  if (args) {
    cli.println(
      `Reading${args.all ? ' all ' : ' '}files ${
        args.backupId ? `for backup ID '${args.backupId}'` : ''
      }${args.client ? `for host '${args.client}'` : ''}...`
    );
    execute(await netBackup.files(args));
  } else {
    cli.println(`No argument given.`);
  }
}

async function execImages(cmd) {
  let args;
  if (cmd.days) args = { daysBack: cmd.days };
  if (cmd.client) args = { client: cmd.client };
  if (cmd.all) args = { all: true };
  if (args) {
    cli.println(
      `Reading${args.all ? ' all ' : ' '}images ${
        args.client ? `for host '${args.client}'` : ''
      }${args.daysBack ? `for ${args.daysBack} dyas back` : ''}...`
    );
    execute(await netBackup.images(args));
  } else {
    cli.println(`No argument given.`);
  }
}

async function execTickets() {
  execute(await netBackup.tickets());
}

async function execEsl() {
  execute(await netBackup.esl());
}

function onProgress(progress) {
  cli.progress.update({
    amount: progress / 100,
    width: cli.width() - 30,
  });
}
function progressStart() {
  cli.progress.start({
    exitOnSig: true,
    catchCrash: true,
    unicode: true,
    width: cli.width() - 30,
    braces: ['[', ']'],
    styles: {
      spinner: ['bold', 'green'],
      braces: ['bold', 'white'],
      bar: ['gray'],
      pct: ['green'],
      remain: ['green'],
    },
  });
}
async function execute(source) {
  const Database = require('./lib/Database');
  try {
    progressStart();
    await source
      .asBatch(2048)
      .on('data', (data) => Database.batch(data))
      .on('progress', onProgress)
      .run();
  } catch (err) {
    cli.progress.erase();
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    cli.warn(cli.red(`Error: ${err.message}\n`));
  } finally {
    cli.progress.end();
    await Database.end();
    cli.println('Done.');
  }
}

async function scheduler(cmd) {
  const Database = require('./lib/Database');
  try {
    for (const taskName in crons) {
      const cron = Cron(crons[taskName]);
      const inSec = Math.floor(cron.msToNext() / 1000);
      const atDate = moment(cron.next());
      if (cmd.list) {
        const line = `${taskName} ${
          inSec ? cli.blue(atDate.from(startTime)) : cli.white.bold('now')
        } (at ${atDate.format('H:mm')})`;
        cli.println(line);
      }
      if (cmd.list || inSec > 0) continue;
      let task;
      switch (taskName) {
        case 'summary':
          task = await netBackup.summary();
          break;
        case 'clients':
          task = await netBackup.clients();
          break;
        case 'policies':
          task = await netBackup.policies();
          break;
        case 'slps':
          task = await netBackup.slps();
          break;
        case 'vaults':
          task = await netBackup.vaults();
          break;
        case 'pureDisks':
          task = await netBackup.pureDisks();
          break;
        case 'retLevels':
          task = await netBackup.retlevels();
          break;
        case 'jobs':
          task = await netBackup.jobs({ daysBack: 1 });
          break;
        case 'allJobs':
          task = await netBackup.jobs({ all: true });
          break;
        case 'files':
          task = await netBackup.files({ all: true });
          break;
        case 'images':
          task = await netBackup.images({ daysBack: 1 });
          break;
        case 'allImages':
          task = await netBackup.images({ all: true });
          break;
        case 'tickets':
          task = await netBackup.tickets();
          break;
        case 'esl':
          task = await netBackup.esl();
          break;
      }
      console.log('Executing', taskName);
      progressStart();
      await task
        .asBatch(2048)
        .on('data', (data) => Database.batch(data))
        .on('progress', onProgress)
        .run();
      cli.progress.end();
    }
  } catch (err) {
    cli.progress.erase();
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    cli.print(cli.red('Error: ' + err.message));
  } finally {
    await Database.end();
    cli.println('Done.');
  }
}
