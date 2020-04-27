const { NetBackupCommand, NetBackupSeparatedConvert } = require("./NetBackup");

class BpplClients extends NetBackupCommand {
  constructor(netBackup) {
    const tables = {
      name: "bpplclients",
      fields: [
        { masterServer: netBackup.masterServer, key: true },
        { name: "string", key: true },
        { architecture: "string" },
        { os: "string" },
        { priority: "number" },
        { u1: "number" },
        { u2: "number" },
        { u3: "number" },
        { updated: netBackup.startTime },
        { obsoleted: null },
      ],
    };
    const convert = new NetBackupSeparatedConvert({ separator: /\s/, tables });
    super(netBackup, {
      binary: "bin/admincmd/bpplclients",
      args: ["-allunique", "-l"],
      transform: { delimiter: /^CLIENT /m, expect: /^[^Err]/, convert },
    });
  }
}
module.exports = { BpplClients };
