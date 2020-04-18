const program = require("commander");
const summary = require("../commands/summary");
const jobs = require("../commands/jobs");
const slps = require("../commands/slps");
const clients = require("../commands/clients");
const policies = require("../commands/policies");

program.command("summary").description("Read summary").action(readSummary);
program
  .command("jobs")
  .description("Read jobs")
  .option("--days <days>", "Days to read", 7)
  .action(readJobs);
program.command("slps").description("Read SLP's").action(readSlps);
program.command("clients").description("Read clients").action(readClients);
program.command("policies").description("Read policies").action(readPolicies);
program.parse(process.argv);

async function readSummary() {
  try {
    console.log("Reading summary...");
    await summary.read();
  } catch (err) {
    console.log("Error: " + err.message);
  }
}

async function readJobs(cmd) {
  try {
    console.log(`Reading jobs (${cmd.days} days)...`);
    await jobs.read(cmd.days);
  } catch (err) {
    console.log("Error: " + err.message);
  }
}

async function readSlps() {
  try {
    console.log("Reading SLP's...");
    await slps.read();
  } catch (err) {
    console.log("Error: " + err.message);
  }
}

async function readClients() {
  try {
    console.log("Reading clients...");
    await clients.read();
  } catch (err) {
    console.log("Error: " + err.message);
  }
}

async function readPolicies() {
  try {
    console.log("Reading policies...");
    await policies.read();
  } catch (err) {
    console.log("Error: " + err.message);
  }
}
