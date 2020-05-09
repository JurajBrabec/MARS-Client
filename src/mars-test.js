const commander = require("commander");
const cli = require("pixl-cli");
const { nbu } = require("../lib/netBackup");
const { Database } = require("../lib/Database");

const command = new commander.Command("test").description("Test").action(test);

module.exports = { command };

async function test() {
  let failedTests = 0;
  function testOutput(testResult) {
    if (testResult.error) failedTests++;
    cli.print(`${testResult.source}: `);
    const color = testResult.error ? cli.red : cli.bold.green;
    cli.println(color(testResult.status), testResult.err);
  }
  try {
    const database = new Database();
    nbu
      .test()
      .then((res) => {
        res.forEach((item) => testOutput(item));
        return database.test();
      })
      .then((res) => {
        testOutput(res);
      })
      .catch((err) => testOutput(err))
      .finally(() => {
        cli.print("-------------\n");
        testOutput({
          source: "All tests",
          error: failedTests,
          status: failedTests ? "not OK" : "OK",
        });
        database.pool.end();
      });
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
