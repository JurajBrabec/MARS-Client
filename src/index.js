const commander = require("commander");
const chalk = require("chalk");
const { BpdbjobsSummary, BpdbjobsReportMostColumns } = require("./bpdbjobs.js");

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

const bpdbjobsSummary = new BpdbjobsSummary(
  "M:\\Veritas\\Netbackup\\bin\\admincmd\\"
);
//bpdbjobsSummary.onFinish=func;
bpdbjobsSummary.execute(() => {
  const bpdbjobsReportMostColumns = new BpdbjobsReportMostColumns(
    "M:\\Veritas\\Netbackup\\bin\\admincmd\\"
  );
  console.log(bpdbjobsSummary.rows);
  bpdbjobsReportMostColumns.masterServer = bpdbjobsSummary.masterServer;
  bpdbjobsReportMostColumns.execute(() => {
    console.log(bpdbjobsReportMostColumns.rows);
  });
});

console.log(
  "Continuing to do node things while the process runs at the same time..."
);

//let stream = process.stdin;
//const fs = require("fs");
//let stream = fs.createReadStream(".gitignore", "utf8");
//let array = [];
//stream.pipe(delimited);

//git config --global user.name "Juraj Brabec"
//git config --global user.email juraj@brabec.sk

//"terminal.integrated.shell.windows": "cmd.exe",
//"terminal.integrated.env.windows": {"path": "P:/PortableApps/NodeJSPortable/App;P:/PortableApps/GitPortable/App/Git/bin"},

//git init
//git add -A
//git commit -m 'First commit'
//git remote add origin https://github.com/JurajBrabec/mars5.git
//git push -u -f origin master

//npm config set scripts-prepend-node-path auto
//"debug.node.autoAttach": "on"
