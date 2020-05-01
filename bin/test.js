const { nbu } = require("../lib/netBackup");

async function test() {
  const util = require("util");
  const { database } = require("../lib/Database");
  try {
    console.log(await database.test());
    await nbu.init();
    const source = nbu.summary();
    console.log(await source.test());
    source.on("progress", console.log);
    const result = await source.toDatabase(database);
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

//if (require.main === module) test();

function xmlTest() {
  const fs = require("fs");
  const convert = require("xml-js");
  const util = require("util");

  fs.readFile(
    "D:/Veritas/NetBackup/DB/Vault/IDA-vault.xml",
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
      const vault_preferences = xml.VAULT_MGR.VAULT_PREFERENCES;
      /*     console.log(vault_preferences._);
    console.log(vault_preferences.RETENTION_MAP.RETMAP_ITEM);
    console.log(vault_preferences.REPORTS.REPORT);
    console.log(vault_preferences.ALIASES);
 */
      xml.VAULT_MGR.ROBOT.forEach((ROBOT) => {
        const robot = ROBOT._;
        ROBOT.VAULT.forEach((VAULT) => {
          const vault = VAULT._;
          (VAULT.PROFILE.length ? VAULT.PROFILE : [VAULT.PROFILE]).forEach(
            (PROFILE) => {
              let section;
              const profile = PROFILE._;
              const selection = PROFILE.SELECTION._;
              section = PROFILE.SELECTION.IMAGE_LOCATION_FILTERS;
              const ilf = section._;
              if (ilf.Enabled === "YES") {
                console.log("ILF");
                console.log(section);
              }
              section = PROFILE.SELECTION.IMAGE_PROPERTIES_FILTERS;
              const ipf = section._;
              if (ipf.Enabled === "YES") {
                const clientFilter = section.CLIENT_FILTER._;
                const clients = section.CLIENT;
                const backupTypeFilter = section.BACKUP_TYPE_FILTER._;
                const backupTypes = section.BACKUP_TYPE;
                const mediaServerFilter = section.MEDIA_SERVER_FILTER._;
                const mediaServers = section.MEDIA_SERVER;
                const classFilter = section.CLASS_FILTER._;
                const classes = section.CLASS;
                const scheduleFilter = section.SCHEDULE_FILTER._;
                const schedules = section.SCHEDULE;
                const retentionLevelFilter = section.RETENTION_LEVEL_FILTER._;
                const retentions = section.RETENTION_LEVEL;
              }
              section = PROFILE.DUPLICATION;
              const duplication = section._;
              if (duplication.Skip === "NO") {
                const duplicationItem = section.DUPLICATION_ITEM._;
                const duplicationItemCopy = section.DUPLICATION_ITEM.COPY._;
              }
              const catalogBackup = PROFILE.CATALOG_BACKUP._;
              const eject = PROFILE.EJECT._;
              const ejectPools = PROFILE.EJECT.POOL;
            }
          );
        });
      });
    }
  );
}
