const dotenv = require("dotenv").config();
const ReadableProcess = require("./dev/ReadableProcess");
const TransformParser = require("./dev/TransformParser");
const path = require("path");

const command = new ReadableProcess({
  debug: true,
  args: ["-summary", "-l"],
  file: path.join(process.env.NBU_BIN, "admincmd", "bpdbjobs.exe"),
});
const transformParser = new TransformParser({ debug: command.debug })
  .on("data", (data) => console.log("T>Data:", data))
  .once("error", (error) => console.log("T>Error:", error.message || error))
  .once("finish", (status) => console.log("T>Finish", status))
  .once("end", (status) => console.log("T>End", status));
transformParser.parser
  .debug(command.debug)
  .split(/(\r?\n){2}/)
  .filter()
  .expect(/^Summary/)
  .split(/\r?\n/)
  .replace("on", ":")
  .separate(":")
  .shift()
  .expect(10);

command
  .on("data", (data) => console.log(">Data:", data))
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", (status) => console.log(">End", status))
  .on("progress", (progress) => console.log(">Progress:", progress))
  .pipe(transformParser);
//  .pipe(process.stdout);
command
  .run()
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error));
//  .finally(() => database.end());
