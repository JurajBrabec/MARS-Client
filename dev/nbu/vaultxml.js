const path = require("path");

class Vaults {
  constructor(nbu) {
    this.file = { path: path.join(nbu.data, "vault", "vault.xml") };
    this.parser = [{ external: this.parse }];
    this.tables = {
      vault_xml: [
        { masterServer: nbu.masterServer, key: true },
        { robot_id: "number" },
        { robot_lastmod: "number" },
        { robot_name: "string" },
        { robotnumber: "number" },
        { robottype: "string" },
        { roboticcontrolhost: "string" },
        { usevaultprefene: "string" },
        { robot_ene: "number" },
        { customerid: "string" },
        { vault_id: "number" },
        { vault_lastmod: "number" },
        { vault_name: "string" },
        { offsitevolumegroup: "string" },
        { robotvolumegroup: "string" },
        { vaultcontainers: "string" },
        { vaultseed: "number" },
        { vendor: "string" },
        { profile_id: "number", key: true },
        { profile_lastmod: "number" },
        { profile_name: "string" },
        { endday: "number" },
        { endhour: "number" },
        { startday: "number" },
        { starthour: "number" },
        { ipf_enabled: "string" },
        { clientfilter: "string" },
        { backuptypefilter: "string" },
        { mediaserverfilter: "string" },
        { classfilter: "string" },
        { schedulefilter: "string" },
        { retentionlevelfilter: "string" },
        { ilf_enabled: "string" },
        { sourcevolgroupfilter: "string" },
        { volumepoolfilter: "string" },
        { basicdiskfilter: "string" },
        { diskgroupfilter: "string" },
        { duplication_skip: "string" },
        { duppriority: "number" },
        { multiplex: "string" },
        { sharedrobots: "string" },
        { sortorder: "number" },
        { altreadhost: "string" },
        { backupserver: "string" },
        { readdrives: "number" },
        { writedrives: "number" },
        { fail: "string" },
        { primary: "string" },
        { retention: "number" },
        { sharegroup: "string" },
        { stgunit: "string" },
        { volpool: "string" },
        { catalogbackup_skip: "string" },
        { eject_skip: "string" },
        { ejectmode: "string" },
        { eject_ene: "string" },
        { suspend: "string" },
        { userbtorvaultprefene: "string" },
        { suspendmode: "string" },
        { imfile: "number" },
        { mode: "string" },
        { useglobalrptsdist: "string" },
        { updated: nbu.startTime },
        { obsoleted: null },
      ],
      vault_item_xml: [
        { masterServer: nbu.masterServer, key: true },
        { profile: "string", key: true },
        { type: "string", key: true },
        { value: "string", key: true },
        { updated: nbu.startTime },
        { obsoleted: null },
      ],
    };
  }
  parse(text) {
    const xmljs = require("xml-js");
    let rows = [];
    const xml = xmljs.xml2js(text, {
      compact: true,
      trim: true,
      declarationKey: "dec",
      instructionKey: "ins",
      attributesKey: "_",
      nativeType: true,
      nativeTypeAttributes: true,
      //alwaysArray: true,
    });
    const VAULT_MGR = xml.VAULT_MGR;
    //    const vault_preferences = VAULT_MGR.VAULT_PREFERENCES._;
    const ROBOTS = VAULT_MGR.ROBOT
      ? VAULT_MGR.ROBOT.length
        ? VAULT_MGR.ROBOT
        : [VAULT_MGR.ROBOT]
      : [];
    ROBOTS.forEach((ROBOT) => {
      const robot = ROBOT._;
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
          //          const ejectPools = PROFILE.EJECT.POOL;
          const reportsSettings = PROFILE.REPORTS_SETTINGS._;
          branch = PROFILE.DUPLICATION;
          const duplication = branch._;
          const row = { vault_xml: {}, vault_item_xml: {} };
          const vault_xml = row.vault_xml;
          vault_xml.robot_id = robot.Id;
          vault_xml.robot_lastmod = robot.LastMod;
          vault_xml.robot_name = robot.Name;
          vault_xml.robotnumber = robot.RobotNumber;
          vault_xml.robottype = robot.RobotType;
          vault_xml.roboticcontrolhost = robot.RoboticControlHost;
          vault_xml.usevaultprefene = robot.UseVaultPrefENE;
          vault_xml.robot_ene = robot.EjectNotificationEmail;
          vault_xml.customerid = vault.CustomerID;
          vault_xml.vault_id = vault.Id;
          vault_xml.vault_lastmod = vault.LastMod;
          vault_xml.vault_name = vault.Name;
          vault_xml.offsitevolumegroup = vault.OffsiteVolumeGroup;
          vault_xml.robotvolumegroup = vault.RobotVolumeGroup;
          vault_xml.vaultcontainers = vault.VaultContainers;
          vault_xml.vaultseed = vault.VaultSeed;
          vault_xml.vendor = vault.Vendor;
          vault_xml.profile_id = profile.Id;
          vault_xml.profile_lastmod = profile.LastMod;
          vault_xml.profile_name = profile.Name;
          vault_xml.endday = selection.EndDay;
          vault_xml.endhour = selection.EndHour;
          vault_xml.startday = selection.StartDay;
          vault_xml.starthour = selection.StartHour;
          vault_xml.catalogbackup_skip = catalogBackup.Skip;
          vault_xml.eject_skip = eject.Skip;
          vault_xml.ejectmode = eject.EjectMode;
          vault_xml.eject_ene = eject.EjectNotificationEmail;
          vault_xml.suspend = eject.Suspend;
          vault_xml.suspendmode = eject.SuspendMode;
          vault_xml.userbtorvaultprefene = eject.UseRbtorVaultPrefENE;
          vault_xml.imfile = reportsSettings.IMFile;
          vault_xml.mode = reportsSettings.Mode;
          vault_xml.useglobalrptsdist = reportsSettings.UseGlobalRptsDist;
          vault_xml.duplication_skip = duplication.Skip;
          if (duplication.Skip === "NO") {
            const duplicationItem = branch.DUPLICATION_ITEM._;
            const duplicationItemCopy = branch.DUPLICATION_ITEM.COPY._;
            vault_xml.duppriority = duplication.DupPriority;
            vault_xml.multiplex = duplication.Multiplex;
            vault_xml.sharedrobots = duplication.SharedRobots;
            vault_xml.sortorder = duplication.SortOrder;
            vault_xml.altreadhost = duplicationItem.AltReadHost;
            vault_xml.backupserver = duplicationItem.BackupServer;
            vault_xml.readdrives = duplicationItem.ReadDrives;
            vault_xml.writedrives = duplicationItem.WriteDrives;
            vault_xml.fail = duplicationItemCopy.Fail;
            vault_xml.primary = duplicationItemCopy.Primary;
            vault_xml.retention = duplicationItemCopy.Retention;
            vault_xml.sharegroup = duplicationItemCopy.ShareGroup;
            vault_xml.stgunit = duplicationItemCopy.StgUnit;
            vault_xml.volpool = duplicationItemCopy.VolPool;
          }
          branch = PROFILE.SELECTION.IMAGE_LOCATION_FILTERS;
          const ILF = branch._;
          row.vault_xml.ilf_enabled = ILF.Enabled;
          if (ILF.Enabled === "YES") {
            const sourceVolGroupFilter = branch.SOURCE_VOL_GROUP_FILTER._;
            const volumePoolFilter = branch.VOLUME_POOL_FILTER._;
            const basicDiskFilter = branch.BASIC_DISK_FILTER._;
            const diskGroupFilter = branch.DISK_GROUP_FILTER._;
            vault_xml.sourcevolgroupfilter = sourceVolGroupFilter.InclExclOpt;
            vault_xml.volumepoolfilter = volumePoolFilter.InclExclOpt;
            vault_xml.basicdiskfilter = basicDiskFilter.InclExclOpt;
            vault_xml.diskgroupfilter = diskGroupFilter.InclExclOpt;
          }
          branch = PROFILE.SELECTION.IMAGE_PROPERTIES_FILTERS;
          const IPF = branch._;
          vault_xml.ipf_enabled = IPF.Enabled;
          if (IPF.Enabled === "YES") {
            const clientFilter = branch.CLIENT_FILTER._;
            if (clientFilter.InclExclOpt !== "INCLUDE_ALL") {
              const clients = branch.CLIENT_FILTER.CLIENT.length
                ? branch.CLIENT_FILTER.CLIENT
                : [branch.CLIENT_FILTER.CLIENT];
              clients.forEach((item) => {
                const vault_item_xml = { ...row.vault_item_xml };
                vault_item_xml.profile = profile.Name;
                vault_item_xml.type = "CLIENT";
                vault_item_xml.value = item._text;
                rows.push({ vault_item_xml });
              });
            }
            const backupTypeFilter = branch.BACKUP_TYPE_FILTER._;
            if (backupTypeFilter.InclExclOpt !== "INCLUDE_ALL") {
              const backupTypes = branch.BACKUP_TYPE_FILTER.BACKUP_TYPE.length
                ? branch.BACKUP_TYPE_FILTER.BACKUP_TYPE
                : [branch.BACKUP_TYPE_FILTER.BACKUP_TYPE];
              backupTypes.forEach((item) => {
                const vault_item_xml = { ...row.vault_item_xml };
                vault_item_xml.profile = profile.Name;
                vault_item_xml.type = "BACKUPTYPE";
                vault_item_xml.value = item._text;
                rows.push({ vault_item_xml });
              });
            }
            const mediaServerFilter = branch.MEDIA_SERVER_FILTER._;
            if (mediaServerFilter.InclExclOpt !== "INCLUDE_ALL") {
              const mediaServers = branch.MEDIA_SERVER_FILTER.MEDIA_SERVER
                .length
                ? branch.MEDIA_SERVER_FILTER.MEDIA_SERVER
                : [branch.MEDIA_SERVER_FILTER.MEDIA_SERVER];
              mediaServers.forEach((item) => {
                const vault_item_xml = { ...row.vault_item_xml };
                vault_item_xml.profile = profile.Name;
                vault_item_xml.type = "MEDIASERVER";
                vault_item_xml.value = item._text;
                rows.push({ vault_item_xml });
              });
            }
            const classFilter = branch.CLASS_FILTER._;
            if (classFilter.InclExclOpt !== "INCLUDE_ALL") {
              const classes = branch.CLASS_FILTER.CLASS.length
                ? branch.CLASS_FILTER.CLASS
                : [branch.CLASS_FILTER.CLASS];
              classes.forEach((item) => {
                const vault_item_xml = { ...row.vault_item_xml };
                vault_item_xml.profile = profile.Name;
                vault_item_xml.type = "CLASS";
                vault_item_xml.value = item._text;
                rows.push({ vault_item_xml });
              });
            }
            const scheduleFilter = branch.SCHEDULE_FILTER._;
            if (scheduleFilter.InclExclOpt !== "INCLUDE_ALL") {
              const schedules = branch.SCHEDULE_FILTER.SCHEDULE.length
                ? branch.SCHEDULE_FILTER.SCHEDULE
                : [branch.SCHEDULE_FILTER.SCHEDULE];
              schedules.forEach((item) => {
                const vault_item_xml = { ...row.vault_item_xml };
                vault_item_xml.profile = profile.Name;
                vault_item_xml.type = "SCHEDULE";
                vault_item_xml.value = item._text;
                rows.push({ vault_item_xml });
              });
            }
            const retentionLevelFilter = branch.RETENTION_LEVEL_FILTER._;
            if (retentionLevelFilter.InclExclOpt !== "INCLUDE_ALL") {
              const retentions = branch.RETENTION_LEVEL_FILTER.RETENTION_LEVEL
                .length
                ? branch.RETENTION_LEVEL_FILTER.RETENTION_LEVEL
                : [branch.RETENTION_LEVEL_FILTER.RETENTION_LEVEL];
              retentions.forEach((item) => {
                const vault_item_xml = { ...row.vault_item_xml };
                vault_item_xml.profile = profile.Name;
                vault_item_xml.type = "RETENTION";
                vault_item_xml.value = item._text;
                rows.push({ vault_item_xml });
              });
            }
            vault_xml.clientfilter = clientFilter.InclExclOpt;
            vault_xml.backuptypefilter = backupTypeFilter.InclExclOpt;
            vault_xml.mediaserverfilter = mediaServerFilter.InclExclOpt;
            vault_xml.classfilter = classFilter.InclExclOpt;
            vault_xml.schedulefilter = scheduleFilter.InclExclOpt;
            vault_xml.retentionlevelfilter = retentionLevelFilter.InclExclOpt;
          }
          rows.push({ vault_xml });
        });
      });
    });
    return rows;
  }
}

module.exports = { Vaults };
