const path = require("path");

class Retlevels {
  constructor(nbu) {
    this.process = {
      file: path.join(nbu.bin, "admincmd", "bpretlevel.exe"),
      args: ["-L"],
    };
    this.parser = [
      { split: /\r?\n/ },
      { filter: "" },
      { shift: 4 },
      { expect: /^\d+/ },
      { replace: [/\(|\)/g, ""] },
      { split: / (?=\d+|expires|infinite)/ },
      { expect: 4 },
    ];
    this.tables = {
      bpretlevel: [
        { masterServer: nbu.masterServer, key: true },
        { level: "number", key: true },
        { days: "number" },
        { seconds: "number" },
        { period: "string" },
      ],
    };
  }
}

module.exports = { Retlevels };
