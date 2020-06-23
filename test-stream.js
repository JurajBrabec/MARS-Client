const dotenv = require("dotenv").config();
const path = require("path");
const ReadableProcess = require("./dev/ReadableProcess");
const parser = require("./dev/Parser");

const command = new ReadableProcess({
  debug: false,
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
  .once("end", (status) => onEnd)
  .on("progress", (progress) => console.log(">Progress:", progress));
command
  .run()
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error));
//  .finally(() => database.end());

function onData(data) {
  try {
    data = parser.buffer(data);
    if (data) console.log(">Data:", data);
  } catch (error) {
    console.log("Parsing error:", error);
  }
}
function onEnd(status) {
  const data = parser.end();
  if (data) console.log(">Data:", data);
  console.log(">End", status);
}
