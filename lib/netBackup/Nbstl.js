const {
  NetBackupCommand,
  NetBackupMultiPartSeparatedConvert,
} = require("./NetBackup");

class Nbstl extends NetBackupCommand {
  constructor(netBackup) {
    const tables = {
      name: "nbstl",
      fields: [
        { masterServer: netBackup.masterServer, key: true },
        { slpName: "string", key: true },
        { dataClassification: "string" },
        { duplicationPriority: "string" },
        { state: "string" },
        { version: "number" },
        { useFor: "number" },
        { storageUnit: "string" },
        { volumePool: "string" },
        { mediaOwner: "string" },
        { retentionType: "number" },
        { retentionLevel: "number" },
        { alternateReadServer: "string" },
        { preserveMpx: "number" },
        { ddoState: "string" },
        { source: "number" },
        { unused: "number" },
        { operationId: "number" },
        { operationIndex: "number" },
        { slpWindow: "string" },
        { targetMaster: "string" },
        { targetMasterSlp: "string" },
        { updated: netBackup.startTime },
        { obsoleted: null },
      ],
    };
    const convert = new NetBackupMultiPartSeparatedConvert({
      separator: / /,
      delimiter: /\r?\n\s*/,
      tables,
    });
    super(netBackup, {
      binary: "bin/admincmd/nbstl",
      args: ["-l"],
      transform: { delimiter: /^(?=[A-Za-z]+)/m, expect: /^(?!Err)./, convert },
    });
    this.title = `Reading SLP's`;
  }
}
module.exports = { Nbstl };
