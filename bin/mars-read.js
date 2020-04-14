const commander = require("commander");
const summary = require("../commands/summary");
const jobs = require("../commands/jobs");
const slps = require("../commands/slps");
const clients = require("../commands/clients");
const policies = require("../commands/policies");

commander.command("summary").description("Read summary").action(readSummary);
commander
  .command("jobs")
  .description("Read jobs")
  .option("--days <days>", "Days to read", 7)
  .action(readJobs);
commander.command("slps").description("Read SLP's").action(readSlps);
commander.command("clients").description("Read clients").action(readClients);
commander.command("policies").description("Read policies").action(readPolicies);
commander.parse(process.argv);

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
