const path = require("path");

class Images {
  constructor(nbu) {
    this.process = {
      file: path.join(nbu.bin, "admincmd", "bpimmedia.exe"),
      args: ["-l"],
    };
    this.parser = [
      { split: /(\r?\n(?=IMAGE))/ },
      { filter: "" },
      { expect: /^IMAGE/ },
      { split: /\r?\n/ },
      { separated: " " },
      { unpivot: null },
      { separate: " " },
      { filter: "IMAGE" },
      { filter: "FRAG" },
      { replace: ["*NULL*", null] },
      { expect: 34 },
    ];
    this.tables = {
      bpimmedia: [
        { masterServer: nbu.masterServer, key: true },
        { name: "string" },
        { version: "number" },
        { backupId: "string", key: true },
        { policy_name: "string" },
        { policy_type: "number" },
        { sched_label: "string" },
        { sched_type: "number" },
        { retention: "number" },
        { num_files: "number" },
        { expiration: "number" },
        { compression: "number" },
        { encryption: "number" },
        { hold: "number" },
      ],
      bpimmedia_frags: [
        { masterServer: nbu.masterServer, key: true },
        { backupId: "string", key: true },
        { copy_number: "number", key: true },
        { fragment_number: "number", key: true },
        { kilobytes: "number" },
        { remainder: "number" },
        { media_type: "number" },
        { density: "number" },
        { file_number: "number" },
        { id_path: "string" },
        { host: "string" },
        { block_size: "number" },
        { offset: "number" },
        { media_date: "number" },
        { device_written_on: "number" },
        { f_flags: "number" },
        { media_descriptor: "string" },
        { expiration: "number" },
        { mpx: "number" },
        { retention_level: "number" },
        { checkpoint: "number" },
        { copy_on_hold: "number" },
      ],
    };
  }
}

class ImagesAll extends Images {}
class ImagesClient extends Images {
  constructor(nbu, client) {
    super(nbu);
    this.process.args.push("-client", client);
  }
}
class ImagesDaysBack extends Images {
  constructor(nbu, days) {
    super(nbu);
    this.process.args.push("-d", nbu.datteDiff(days));
  }
}

module.exports = { Images, ImagesAll, ImagesClient, ImagesDaysBack };
