const EmitterProcess = require("./dev/EmitterProcess");
const parser = require("./dev/Parser");
const tables = require("./lib/Tables");
const { summary, jobs } = require("./dev/nbu/bpdbjobs");

const command = summary;
const debug = false;
const process = new EmitterProcess(command.process).debug(debug);
parser.create(command.parser).debug(debug);
tables.create(command.tables).asObject();

process
  .on("data", onData)
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", (status) => console.log(">End", status))
  .on("progress", (progress) => console.log(">Progress:", progress));
process
  .run()
  .then((result) =>
    console.log("Result:", tables.assign(JSON.parse(parser.parse(result))))
  )
  .catch((error) => console.log("Error:", error));
//  .finally(() => database.end());

function onData(data) {
  try {
    data = tables.assign(JSON.parse(parser.parse(data)));
    if (data) console.log(">Data:", data);
  } catch (error) {
    console.log("Parsing error:", error);
  }
}
