const EmitterSql = require("./dev/EmitterSql");
const pool = require("./dev/Database");

const command = new EmitterSql({
  debug: true,
  pool,
  sql: "show tables like :name;",
});
command
  .on("data", (data) => console.log(">Data:", data))
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", (status) => console.log(">End", status))
  .on("progress", (progress) => console.log(">Progress:", progress));
command
  .run({ name: "%xml" })
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error))
  .finally(() => pool.end());
