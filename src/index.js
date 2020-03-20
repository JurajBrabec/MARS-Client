const commander = require("commander");
const chalk = require("chalk");
const dotenv = require("dotenv");
const { NetBackup } = require("./netBackup");
dotenv.config();

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

const NBU = new NetBackup(process.env.NBU_HOME);
NBU.init()
  .then(() => {
    console.log(chalk.blue(`Master Server: ${NBU.masterServer}`));
    return NBU.getSummary();
  })
  .then(rows => {
    console.log("summary:");
    rows.pipe(process.stdout);
    return NBU.getJobs();
  })
  .then(rows => {
    console.log("jobs:");
    rows.pipe(process.stdout);
  })
  .catch(err => {
    console.log(chalk.red("Error:" + err));
  });

console.log(
  "Continuing to do node things while the process runs at the same time..."
);

//git config --global user.name "Juraj Brabec"
//git config --global user.email juraj@brabec.sk

//"terminal.integrated.shell.windows": "bash.exe",
//"terminal.integrated.env.windows": {"path": "P:/PortableApps/NodeJSPortable/App;P:/PortableApps/GitPortable/App/Git/bin"},

//git init
//git add -A
//git commit -m 'First commit'
//git remote add origin https://github.com/JurajBrabec/mars5.git
//git push -u -f origin master

//npm config set scripts-prepend-node-path auto
//"debug.node.autoAttach": "on"
