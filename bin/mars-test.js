const program = require("commander");
const cli = require("pixl-cli");
const { nbu } = require("../lib/netBackup");
const { database } = require("../lib/Database");

let failedTests = 0;
function testOutput(testResult) {
  if (testResult.error) failedTests++;
  cli.print(`${testResult.source}: `);
  //  cli.print("\t\t");
  const color = testResult.error ? cli.red : cli.bold.green;
  cli.print(color(testResult.status), testResult.err);
  cli.print("\n");
}
try {
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
