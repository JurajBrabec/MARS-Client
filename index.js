const commander=require('commander');
const chalk = require('chalk');

commander
    .version('v0.0.1')
    .description('This is a dummy demo CLI.')
    .option('-n, --aname <type>', 'To input a name')
    .option('demo', 'To output demo')
    .parse(process.argv);

    console.log( chalk.red( 'TEST' )) ;
if (commander.aname) console.log(`Your name is ${commander.aname}.`);
if (commander.demo) console.log(`This is a DEMO.`);

