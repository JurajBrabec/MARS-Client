#!/usr/bin/env node

const program = require("commander");
const pkg = require("../package.json");

program
  .version(pkg.version, "-v, --version")
  .description(pkg.description)
  .command("config", "configure settings")
  .command("read <task>", "reading info")
  .command("write <task>", "writing info")
  .command("scheduler", "execute tasks according to schedule")
  .command("test", "test settings")
  .option("-d, --debug", "debug mode")
  .parse(process.argv);
