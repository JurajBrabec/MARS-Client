const path = require("path");

class PureDisks {
  constructor(nbu) {
    this.process = {
      file: path.join(nbu.bin, "admincmd", "nbdevquery.exe"),
      args: ["-listdv", "-stype", "PureDisk", "-l"],
    };
    this.parser = [
      { split: /\r?\n/ },
      { filter: "" },
      { expect: /^V_\d/ },
      { split: " " },
      { expect: 15 },
    ];
    this.tables = {
      nbdevquery_listdv_puredisk: [
        { masterServer: nbu.masterServer, key: true },
        { version: "string" },
        { diskPool: "string" },
        { sType: "string" },
        { name: "string", key: true },
        { disk_media_id: "string" },
        { total_capacity: "float" },
        { free_space: "float" },
        { used: "number" },
        { nbu_state: "number" },
        { sts_state: "number" },
        { num_write_mounts: "number" },
        { active_read_streams: "number" },
        { active_write_streams: "number" },
        { flags: "number" },
        { num_read_mounts: "number" },
        { updated: nbu.startTime },
        { obsoleted: null },
      ],
    };
  }
}

module.exports = { PureDisks };
