const { NetBackupCommand, NetBackupSeparatedConvert } = require("./NetBackup");

class BpFlist extends NetBackupCommand {
  constructor(netBackup, tableName, args) {
    const tables = {
      name: tableName,
      fields: [
        { masterServer: netBackup.masterServer, key: true },
        { image_version: "number" },
        { client_type: "number" },
        { start_time: "number" },
        { timeStamp: "number" },
        { schedule_type: "number" },
        { client: "string" },
        { policy_name: "string" },
        { backupId: "string", key: true },
        { dummy1: "string", ignore: true },
        { peer_name: "string" },
        { lines: "number" },
        { options: "number" },
        { user_name: "string" },
        { group_name: "string" },
        { dummy2: "string", ignore: true },
        { raw_partition_id: "number" },
        { jobid: "number" },
        { file_number: "number", key: true },
        { compressed_size: "number" },
        { path_length: "number" },
        { data_length: "number" },
        { block: "number" },
        { in_image: "number" },
        { raw_size: "number" },
        { gb: "number" },
        { device_number: "number" },
        { path: "string" },
        { directory_bits: "number" },
        { owner: "string" },
        { group: "string" },
        { bytes: "number" },
        { access_time: "number" },
        { modification_time: "number" },
        { inode_time: "number" },
      ],
    };
    const convert = new NetBackupSeparatedConvert({
      separator: /\s+(?=(?:[^\/]*\/[^\/]*\/)*[^\/]*$)/,
      tables,
    });
    super(netBackup, {
      binary: "bin/admincmd/bpflist",
      args,
      transform: { delimiter: /^FILES /m, expect: /\d+/, convert },
    });
  }
}

class BpFlistBackupId extends BpFlist {
  constructor(netBackup, backupId) {
    const args = ["-l", "-backupid", backupId];
    const tableName = "bpflist_backupid";
    super(netBackup, tableName, args);
  }
}

class BpFlistClient extends BpFlist {
  constructor(netBackup, client) {
    const args = ["-l", "-client", client];
    const tableName = "bpflist_backupid";
    super(netBackup, tableName, args);
  }
}

class BpFlistAll extends BpFlist {
  constructor(netBackup, concurrency) {
    const args = ["-l"];
    const tableName = "bpflist_backupid";
    super(netBackup, tableName, args);
    this.concurrency = concurrency || 1;
  }
  getItems() {
    return this.netBackup.clients().asObjects();
  }
  getItem(item) {
    return new BpFlistClient(this.netBackup, item.bpplclients.name);
  }
}

module.exports = { BpFlistBackupId, BpFlistClient, BpFlistAll };
