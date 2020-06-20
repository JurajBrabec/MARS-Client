const ReadableSql = require("./dev/ReadableSql");
const pool = require("./dev/Database");

const command = new ReadableSql({
  debug: true,
  pool,
  sql: "show tables;",
});
command
  .on("data", (data) => console.log(">Data:", data))
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", (status) => console.log(">End", status))
  .on("progress", (progress) => console.log(">Progress:", progress))
  .pipe(process.stdout);
command
  .run()
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error))
  .finally(() => pool.end());
