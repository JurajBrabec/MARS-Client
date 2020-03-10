const commander = require("commander");
const chalk = require("chalk");
const Delimited = require("./delimited.js");

commander
  .version("v0.0.1")
  .description("This is a dummy demo CLI.")
  .option("-n, --aname <type>", "To input a name")
  .option("demo", "To output demo")
  .parse(process.argv);

console.log(chalk.red("TEST"));
if (commander.aname) console.log(`Your name is ${commander.aname}.`);
if (commander.demo) console.log(`This is a DEMO.`);

const delimited = new Delimited(/\n\n(?=#)/g);
//let stream = process.stdin;
const fs = require("fs");
let stream = fs.createReadStream(".gitignore", "utf8");
let array = [];

delimited.on("data", chunk => {
  console.log(chunk);
  return array.push(chunk);
});
delimited.on("end", () => console.log(array));

stream.pipe(delimited);

//git config --global user.name "Juraj Brabec"
//git config --global user.email juraj@brabec.sk

//"terminal.integrated.shell.windows": "cmd.exe",
//"terminal.integrated.env.windows": {"path": "P:/PortableApps/NodeJSPortable/App;P:/PortableApps/GitPortable/App/Git/bin"},

//git init
//git add -A
//git commit -m 'First commit'
//git remote add origin https://github.com/JurajBrabec/mars5.git
//git push -u -f origin master
