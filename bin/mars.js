#!/usr/bin/env node

const commander = require("commander");
const pkg = require("../package.json");

commander
  .version(pkg.version)
  .description(pkg.description)
  .command("read", "Reading info")
  .command("write", "Writing info")
  .option("-d, --debug", "Debug mode")
  .parse(process.argv);
