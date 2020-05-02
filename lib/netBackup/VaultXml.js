const xmljs = require("xml-js");
const {
  NetBackupFile,
  NetBackupSeparatedConvert,
  NetBackupLabeledConvert,
} = require("./NetBackup");

class VaultXmlLabeledConvert extends NetBackupLabeledConvert {
  subConvert(name, text, values = {}) {
    const fields = this.tables.table(name).fieldDefinition;
    for (let key in values) {
      fields.find((field) => {
        if (field[key]) field[key] = values[key];
      });
    }
    const tables = { name, fields };
    const convert = new NetBackupSeparatedConvert({ separator: / /, tables });
    const result = convert.convert(text);
    return result.row[0];
  }
  convert(text) {
    const result = { row: [] };
    let row = this.parse(text);
    const src = row.vault;
    let table = "vault_xml";
    row = this.subConvert(table, [src.robot, src.vault, src.profile].join(" "));
    //    this.tables.set(row, table, "key", src.key);
    if (src.includes) {
      this.tables.set(
        row,
        table,
        "include",
        src.includes
          .split(/^INCLUDE (.+)\n?/m)
          .filter((item) => item !== "")
          .join(",")
          .trim()
      );
    }
    if (this.validate(row)) result.row.push(row);
    const vaultXmlValues = { robot: row[table].robot };
    if (src.clients) {
      table = "vault_xml_items";
      src.clients
        .split(/^CLIENT /m)
        .filter((item) => item !== "")
        .forEach((item) => {
          const row = this.subConvert(table, item, policyValues);
          if (this.validate(row)) result.row.push(row);
        });
    }
    return result;
  }
}

class VaultXml extends NetBackupFile {
  constructor(netBackup) {
    const tables = [
      {
        name: "vault",
        fields: [
          { robot: /^ROBOT (.+)/ },
          { vault: /^VAULT (.+)/ },
          { profile: /^PROFILE (.+)/ },
        ],
      },
      {
        name: "vault_xml",
        fields: [
          { masterServer: netBackup.masterServer, key: true },
          { robot: "string" },
          { vault: "string" },
          { profile: "string" },
          { updated: netBackup.startTime },
          { obsoleted: null },
        ],
      },
      {
        name: "vault_xml_items",
        fields: [
          { masterServer: netBackup.masterServer, key: true },
          { updated: netBackup.startTime },
          { obsoleted: null },
        ],
      },
    ];
    const convert = new VaultXmlLabeledConvert({ tables });
    super(netBackup, {
      file: "db/vault/vault.xml",
      transform: { delimiter: /^(?=ROBOT)/m, expect: /^ROBOT/, convert },
    });
  }
  fileContents(data) {
    const xml = xmljs.xml2js(data, {
      compact: true,
      trim: true,
      declarationKey: "dec",
      instructionKey: "ins",
      attributesKey: "_",
      nativeType: true,
      nativeTypeAttributes: true,
      //      alwaysArray:true;
    });
    //console.log(util.inspect(vault_preferences, false, null, true));
    let result = "";
    const VAULT_MGR = xml.VAULT_MGR;
    const vault_preferences = VAULT_MGR.VAULT_PREFERENCES._;
    const ROBOTS = VAULT_MGR.ROBOT
      ? VAULT_MGR.ROBOT.length
        ? VAULT_MGR.ROBOT
        : [VAULT_MGR.ROBOT]
      : [];
    ROBOTS.forEach((ROBOT) => {
      const robot = ROBOT._;
      result += `ROBOT ${robot.Name}\n`;
      const VAULTS = ROBOT.VAULT
        ? ROBOT.VAULT.length
          ? ROBOT.VAULT
          : [ROBOT.VAULT]
        : [];
      VAULTS.forEach((VAULT) => {
        const vault = VAULT._;
        result += `VAULT ${vault.Name}\n`;
        const PROFILES = VAULT.PROFILE
          ? VAULT.PROFILE.length
            ? VAULT.PROFILE
            : [VAULT.PROFILE]
          : [];
        PROFILES.forEach((PROFILE) => {
          let branch;
          const profile = PROFILE._;
          result += `PROFILE ${profile.Name}\n`;
          const selection = PROFILE.SELECTION._;
          const catalogBackup = PROFILE.CATALOG_BACKUP._;
          const eject = PROFILE.EJECT._;
          const ejectPools = PROFILE.EJECT.POOL;
          branch = PROFILE.DUPLICATION;
          const DUPLICATION = branch._;
          if (DUPLICATION.Skip === "NO") {
            const duplicationItem = branch.DUPLICATION_ITEM._;
            const duplicationItemCopy = branch.DUPLICATION_ITEM.COPY._;
          }
          branch = PROFILE.SELECTION.IMAGE_LOCATION_FILTERS;
          const ILF = branch._;
          if (ILF.Enabled === "YES") {
            const sourceVolGroupFilter = branch.SOURCE_VOL_GROUP_FILTER._;
            const volumePoolFilter = branch.VOLUME_POOL_FILTER._;
            const basicDiskFilter = branch.BASIC_DISK_FILTER._;
            const diskGroupFilter = branch.DISK_GROUP_FILTER._;
          }
          branch = PROFILE.SELECTION.IMAGE_PROPERTIES_FILTERS;
          const IPF = branch._;
          if (IPF.Enabled === "YES") {
            const clientFilter = branch.CLIENT_FILTER._;
            const clients = branch.CLIENT;
            const backupTypeFilter = branch.BACKUP_TYPE_FILTER._;
            const backupTypes = branch.BACKUP_TYPE;
            const mediaServerFilter = branch.MEDIA_SERVER_FILTER._;
            const mediaServers = branch.MEDIA_SERVER;
            const classFilter = branch.CLASS_FILTER._;
            const classes = branch.CLASS;
            const scheduleFilter = branch.SCHEDULE_FILTER._;
            const schedules = branch.SCHEDULE;
            const retentionLevelFilter = branch.RETENTION_LEVEL_FILTER._;
            const retentions = branch.RETENTION_LEVEL;
          }
        });
      });
    });
    return result;
  }
}
module.exports = { VaultXml };
