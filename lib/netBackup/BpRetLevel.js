const { NetBackupCommand, NetBackupLabeledConvert } = require("./NetBackup");

class BpRetLevel extends NetBackupCommand {
  constructor(netBackup) {
    const tables = {
      name: "bpretlevel",
      fields: [
        { masterServer: netBackup.masterServer, key: true },
        { level: /^\s+(\d+)/, key: true },
        { days: /^\s+\d+\s+(\d+)/ },
        { seconds: /\(\s*(\d+)\)/ },
        { period: /\)\s(.+)$/ },
      ],
    };
    const convert = new NetBackupLabeledConvert({ tables });
    super(netBackup, {
      binary: "bin/admincmd/bpretlevel",
      args: ["-L"],
      transform: {
        delimiter: /\r?\n/m,
        expect: /^\s+\d/,
        ignore: /^R|L|-/,
        convert,
      },
    });
    this.title = `Reading retention levels`;
  }
}
module.exports = { BpRetLevel };
