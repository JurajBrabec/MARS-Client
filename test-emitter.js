const dotenv = require("dotenv").config();
const path = require("path");
const EmitterProcess = require("./dev/EmitterProcess");
const parser = require("./dev/Parser");

const command = new EmitterProcess({
  debug: true,
  args: ["-summary", "-l"],
  file: path.join(process.env.NBU_BIN, "admincmd", "bpdbjobs.exe"),
});
parser
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
  .on("data", onData)
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", (status) => console.log(">End", status))
  .on("progress", (progress) => console.log(">Progress:", progress));
command
  .run()
  .then((result) => console.log("Result:", parser.parse(result)))
  .catch((error) => console.log("Error:", error));
//  .finally(() => database.end());

function onData(data) {
  try {
    data = parser.parse(data);
    if (data) console.log(">Data:", data);
  } catch (error) {
    console.log("Parsing error:", error);
  }
}
