const {
  NetBackupCommand,
  NetBackupMultiPartSeparatedConvert,
} = require("./NetBackup");

class BpimMediaConvert extends NetBackupMultiPartSeparatedConvert {
  parseFirst(rows, line) {
    const row = super.parseFirst(rows, line);
    delete row.bpimmedia_frags;
    rows.push(row);
    return row;
  }
  parseOthers(line) {
    const row = super.parseOthers(
      [this.first.row.bpimmedia.backupId, line].join(" ")
    );
    delete row.bpimmedia;
    return row;
  }
}

class BpimMedia extends NetBackupCommand {
  constructor(netBackup, args) {
    const tables = [
      {
        name: "bpimmedia",
        fields: [
          { masterServer: netBackup.masterServer, key: true },
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
      },
      {
        name: "bpimmedia_frags",
        fields: [
          { masterServer: netBackup.masterServer, key: true },
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
      },
    ];
    const convert = new BpimMediaConvert({
      separator: / /,
      delimiter: /^FRAG /m,
      tables,
    });
    super(netBackup, {
      binary: "bin/admincmd/bpimmedia",
      args,
      transform: { delimiter: /^IMAGE /m, expect: /^[^Err]/, convert },
    });
  }
}

class BpimMediaDays extends BpimMedia {
  constructor(netBackup, days) {
    const args = ["-l", "-d", netBackup.dateDiff(-days)];
    super(netBackup, args);
  }
}

class BpimMediaClient extends BpimMedia {
  constructor(netBackup, client) {
    const args = ["-l", "-client", client];
    super(netBackup, args);
  }
}

class BpimMediaAll extends BpimMedia {
  constructor(netBackup, concurrency) {
    const args = ["-l"];
    super(netBackup, args);
    this.concurrency = concurrency || 1;
  }
  getItems(item) {
    return item
      ? new BpimMediaClient(this.netBackup, item.bpplclients.name)
      : this.netBackup.clients().asObjects();
  }
}

module.exports = { BpimMediaDays, BpimMediaClient, BpimMediaAll };
