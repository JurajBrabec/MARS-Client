const ReadableProcess = require("./dev/ReadableProcess");
const TransformParser = require("./dev/TransformParser");
const tables = require("./lib/Tables");
const { summary, jobs } = require("./dev/nbu/bpdbjobs");

const command = summary;
const debug = false;
const process = new ReadableProcess(command.process).debug(debug);
const transform = new TransformParser()
  .on("data", onData)
  .once("error", (error) => console.log("T>Error:", error.message || error))
  .once("end", () => console.log("T>End"))
  .once("finish", onFinish)
  .debug(debug);
transform.parser.create(command.parser).debug(debug);
tables.create(command.tables).asBatch(1);

process
  .once("end", (status) => console.log(">End", status))
  .once("error", (error) => console.log(">Error:", error.message || error))
  .on("progress", (progress) => console.log(">Progress:", progress))
  .pipe(transform);
process
  .run()
  .then((result) => console.log("Result:", result))
  .catch((error) => console.log("Error:", error));
//  .finally(() => database.end());

function onData(data) {
  try {
    data = tables.assign(JSON.parse(data));
    if (data) console.log("T>Data:", data.bpdbjobs_summary);
  } catch (error) {
    console.log("Parsing error:", error);
  }
}

function onFinish() {
  try {
    data = tables.end();
    if (data) console.log("T>TablesEnd:", data.bpdbjobs_summary);
  } catch (error) {
    console.log("Parsing error:", error);
  }
  console.log("T>Finish");
}
