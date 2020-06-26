const path = require("path");

class Clients {
  constructor(nbu) {
    this.process = {
      file: path.join(nbu.bin, "admincmd", "bpplclients.exe"),
      args: ["-allunique", "-l"],
    };
    this.parser = [
      { split: /\r?\n/ },
      { filter: "" },
      { expect: /^CLIENT/ },
      { separate: " " },
      { filter: "CLIENT" },
      { replace: ["*NULL*", null] },
      { expect: 7 },
    ];
    this.tables = {
      bpplclients: [
        { masterServer: nbu.masterServer, key: true },
        { name: "string", key: true },
        { architecture: "string" },
        { os: "string" },
        { priority: "number" },
        { u1: "number" },
        { u2: "number" },
        { u3: "number" },
        { updated: nbu.startTime },
        { obsoleted: null },
      ],
    };
  }
}

module.exports = { Clients };
