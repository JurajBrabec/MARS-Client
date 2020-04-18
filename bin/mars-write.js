const program = require("commander");

program
  .command("sm9")
  .description("Write SM9 tickets")
  .option("--hours <hours>", "Hours to write", 1)
  .action(writeSM9);
program.command("esl").description("Write ESL information").action(writeESL);
program.parse(process.argv);

function writeSM9(cmd) {
  console.log("Writing SM9 tickets...");
  console.log(cmd.hours);
}
function writeESL() {
  console.log("Writing ESL infomration...");
}
