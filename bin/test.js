const { nbu } = require("../lib/netBackup");

async function test() {
  const util = require("util");
  const { database } = require("../lib/Database");
  try {
    console.log(await database.test());
    await nbu.init();
    const source = nbu.vaults();
    console.log(await source.test());
    source.on("progress", console.log);
    //    const result = await source.toDatabase(database);
    const result = await source.asObjects();
    console.log(util.inspect(result, false, null, true));
    console.log(util.inspect(source.status, false, null, true));
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    console.log("Error: " + err.message);
  } finally {
    await database.pool.end();
  }
}

if (require.main === module) test();

function xmlTest() {
  const fs = require("fs");
  const convert = require("xml-js");
  const util = require("util");

  fs.readFile(
    "D:/Veritas/NetBackup/DB/Vault/TUL-vault.xml",
    "utf8",
    (err, data) => {
      if (err) return console.log(err);
      const xml = convert.xml2js(data, {
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
      const VAULT_MGR = xml.VAULT_MGR;
      const vault_preferences = VAULT_MGR.VAULT_PREFERENCES._;
      const ROBOTS = VAULT_MGR.ROBOT
        ? VAULT_MGR.ROBOT.length
          ? VAULT_MGR.ROBOT
          : [VAULT_MGR.ROBOT]
        : [];
      ROBOTS.forEach((ROBOT) => {
        const robot = ROBOT._;
        console.log(robot);

        const VAULTS = ROBOT.VAULT
          ? ROBOT.VAULT.length
            ? ROBOT.VAULT
            : [ROBOT.VAULT]
          : [];
        VAULTS.forEach((VAULT) => {
          const vault = VAULT._;
          const PROFILES = VAULT.PROFILE
            ? VAULT.PROFILE.length
              ? VAULT.PROFILE
              : [VAULT.PROFILE]
            : [];
          PROFILES.forEach((PROFILE) => {
            let branch;
            const profile = PROFILE._;
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
    }
  );
}
//xmlTest();
