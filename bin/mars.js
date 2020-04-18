#!/usr/bin/env node

const program = require("commander");
const pkg = require("../package.json");

program
  .version(pkg.version, "-v, --version")
  .description(pkg.description)
  .command("read <task>", "reading info")
  .command("write", "writing info")
  .option("-d, --debug", "debug mode")
  .parse(process.argv);
