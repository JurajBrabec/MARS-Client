const { NetBackupCommand, NetBackupSeparatedConvert } = require("./NetBackup");

class NbDevQueryListDvPureDisk extends NetBackupCommand {
  constructor(netBackup) {
    const tables = {
      name: "nbdevquery_listdv_puredisk",
      fields: [
        { masterServer: netBackup.masterServer, key: true },
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
        { updated: netBackup.startTime },
        { obsoleted: null },
      ],
    };
    const convert = new NetBackupSeparatedConvert({ separator: /\s/, tables });
    super(netBackup, {
      binary: "bin/admincmd/nbdevquery",
      args: ["-listdv", "-stype", "PureDisk", "-l"],
      transform: { delimiter: /\r?\n/m, expect: /^(?!Err)./, convert },
    });
    this.title = `Reading pure disks`;
  }
}
module.exports = { NbDevQueryListDvPureDisk };
