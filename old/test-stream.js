const ReadableProcess = require("./dev/ReadableProcess");
const parser = require("./dev/Parser");
const tables = require("./lib/Tables");
const { summary, jobs } = require("./dev/nbu/bpdbjobs");

const command = jobs;
const debug = false;
const process = new ReadableProcess(command.process).debug(debug);
parser.create(command.parser).debug(debug);
tables.create(command.tables).asBatch(2048);

process
  .on("data", onData)
  .once("error", (error) => console.log(">Error:", error.message || error))
  .once("end", onEnd)
  .on("progress", (progress) => console.log(">Progress:", progress));
process
  .run()
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error));
//  .finally(() => database.end());

function onData(data) {
  try {
    data = parser.buffer(data);
    if (data) {
      data = tables.assign(JSON.parse(data));
      if (data) console.log(">Data:", data.bpdbjobs_report[0].rows.length);
    }
  } catch (error) {
    console.log("Parsing error:", error);
  }
}
function onEnd(status) {
  try {
    data = parser.end();
    if (data) {
      data = tables.assign(JSON.parse(data));
      if (data) console.log(">ParserEnd:", data.bpdbjobs_report[0].rows.length);
    }
    data = tables.end();
    if (data) console.log(">TablesEnd:", data.bpdbjobs_report.rows.length);
  } catch (error) {
    console.log("Parsing error:", error);
  }
  console.log(">End", status);
}
