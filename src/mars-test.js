const commander = require("commander");
const cli = require("pixl-cli");
const fs = require("fs");
const { nbu } = require("../lib/netBackup");
const { Database } = require("../lib/Database");

const command = new commander.Command("test").description("Test").action(test);

module.exports = { command };

async function test() {
  let failedTests = 0;
  let result;
  function testOutput(testResult) {
    let status = `${testResult.source}: `;
    if (testResult.error) {
      failedTests++;
      status += cli.red(testResult.status + ": " + testResult.error);
    } else {
      status += cli.bold.green(testResult.status);
    }
    cli.println(status);
  }
  try {
    cli.println("Executing tests...\n");
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
        cli.print("\n");
        result = {
          source: "Test results",
          error: failedTests,
          status: failedTests ? "Failed" : "OK",
        };
        testOutput(result);
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
