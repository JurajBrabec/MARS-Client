const commander = require('commander');
const cli = require('pixl-cli');
const pkg = require('../package.json');
const { Nbu } = require('./nbu/nbu');

const nbu = new Nbu();
const program = new commander.Command();
program
  .version(pkg.version, '-v, --version')
  .description(pkg.description)
  .option('--debug', 'debug mode');
const command = new commander.Command('exec').description('Execution');
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
program.parse(process.argv);

async function execSummary() {
  cli.println(`Reading summary...`);
  execute(await nbu.summary());
}

async function execSlps() {
  cli.println(`Reading SLP's...`);
  execute(await nbu.slps());
}

async function execClients() {
  cli.println(`Reading clients...`);
  execute(await nbu.clients());
}

async function execPolicies() {
  cli.println(`Reading policies...`);
  execute(await nbu.policies());
}

async function execRetLevels() {
  cli.println(`Reading retention levels...`);
  execute(await nbu.retlevels());
}

async function execPureDisks() {
  cli.println(`Reading pure disks...`);
  execute(await nbu.pureDisks());
}

async function execVaults() {
  cli.println(`Reading vaults...`);
  execute(await nbu.vaults());
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
    execute(await nbu.jobs(args));
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
    execute(await nbu.files(args));
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
    execute(await nbu.images(args));
  } else {
    cli.println(`No argument given.`);
  }
}

async function execTickets() {
  execute(await nbu.tickets());
}

async function execEsl() {
  execute(await nbu.esl());
}

function onProgress(progress) {
  cli.progress.update({
    amount: progress / 100,
    width: cli.width() - 40,
  });
}
function progressStart() {
  cli.progress.start({
    exitOnSig: true,
    catchCrash: true,
    unicode: true,
    width: cli.width() - 40,
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
  const Database = require('./Database');
  try {
    progressStart();
    await source
      .asBatch(2048)
      .on('data', (data) => Database.batch(data))
      .on('progress', onProgress)
      .run();
    cli.progress.erase();
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
