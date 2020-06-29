const path = require("path");

class SLPs {
  constructor(nbu) {
    this.process = {
      file: path.join(nbu.bin, "admincmd", "nbstl.exe"),
      args: ["-l"],
    };
    this.parser = [
      { split: /\r?\n(?=[A-Za-z]+)/ },
      { split: /\r?\n/ },
      { separated: " " },
      { unpivot: null },
      { separate: " " },
      { replace: ["*NULL*", null] },
      { expect: 21 },
    ];
    this.tables = {
      nbstl: [
        { masterServer: nbu.masterServer, key: true },
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
        { updated: nbu.startTime },
        { obsoleted: null },
      ],
    };
  }
}

module.exports = { SLPs };
