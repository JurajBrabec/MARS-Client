const path = require('path');
const xmljs = require('xml-js');
const { Actions } = require('../TextParser');
const { Set } = Actions;

class Vaults {
  constructor(netBackup) {
    this.description = 'Reading vaults...';
    this.file = { path: path.join(netBackup.data, 'vault', 'vault.xml') };
    this.parser = [Set.external(this.parse)];
    this.tables = {
      vault_xml: [
        { masterServer: netBackup.masterServer, key: true },
        { robot_id: 'number' },
        { robot_lastmod: 'number' },
        { robot_name: 'string' },
        { robotnumber: 'number' },
        { robottype: 'string' },
        { roboticcontrolhost: 'string' },
        { usevaultprefene: 'string' },
        { robot_ene: 'string' },
        { customerid: 'string' },
        { vault_id: 'number' },
        { vault_lastmod: 'number' },
        { vault_name: 'string' },
        { offsitevolumegroup: 'string' },
        { robotvolumegroup: 'string' },
        { vaultcontainers: 'string' },
        { vaultseed: 'number' },
        { vendor: 'string' },
        { profile_id: 'number', key: true },
        { profile_lastmod: 'number' },
        { profile_name: 'string' },
        { endday: 'number' },
        { endhour: 'number' },
        { startday: 'number' },
        { starthour: 'number' },
        { ipf_enabled: 'string' },
        { clientfilter: 'string' },
        { backuptypefilter: 'string' },
        { mediaserverfilter: 'string' },
        { classfilter: 'string' },
        { schedulefilter: 'string' },
        { retentionlevelfilter: 'string' },
        { ilf_enabled: 'string' },
        { sourcevolgroupfilter: 'string' },
        { volumepoolfilter: 'string' },
        { basicdiskfilter: 'string' },
        { diskgroupfilter: 'string' },
        { duplication_skip: 'string' },
        { duppriority: 'number' },
        { multiplex: 'string' },
        { sharedrobots: 'string' },
        { sortorder: 'number' },
        { altreadhost: 'string' },
        { backupserver: 'string' },
        { readdrives: 'number' },
        { writedrives: 'number' },
        { fail: 'string' },
        { primary: 'string' },
        { retention: 'number' },
        { sharegroup: 'string' },
        { stgunit: 'string' },
        { volpool: 'string' },
        { catalogbackup_skip: 'string' },
        { eject_skip: 'string' },
        { ejectmode: 'string' },
        { eject_ene: 'string' },
        { suspend: 'string' },
        { userbtorvaultprefene: 'string' },
        { suspendmode: 'string' },
        { imfile: 'number' },
        { mode: 'string' },
        { useglobalrptsdist: 'string' },
        { updated: netBackup.startTime },
        { obsoleted: null },
      ],
      vault_item_xml: [
        { masterServer: netBackup.masterServer, key: true },
        { profile: 'string', key: true },
        { type: 'string', key: true },
        { value: 'string', key: true },
        { updated: netBackup.startTime },
        { obsoleted: null },
      ],
    };
  }
  parse(text) {
    const vaults = [];
    const vaultItems = [];
    let newVault = [];
    const xml = xmljs.xml2js(text, {
      compact: true,
      trim: true,
      declarationKey: 'dec',
      instructionKey: 'ins',
      attributesKey: '_',
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
          newVault = [
            robot.Id,
            robot.LastMod,
            robot.Name,
            robot.RobotNumber,
            robot.RobotType,
            robot.RoboticControlHost,
            robot.UseVaultPrefENE,
            robot.EjectNotificationEmail,
            vault.CustomerID,
            vault.Id,
            vault.LastMod,
            vault.Name,
            vault.OffsiteVolumeGroup,
            vault.RobotVolumeGroup,
            vault.VaultContainers,
            vault.VaultSeed,
            vault.Vendor,
            profile.Id,
            profile.LastMod,
            profile.Name,
            selection.EndDay,
            selection.EndHour,
            selection.StartDay,
            selection.StartHour,
          ];
          branch = PROFILE.SELECTION.IMAGE_PROPERTIES_FILTERS;
          const IPF = branch._;
          newVault.push(IPF.Enabled);
          if (IPF.Enabled === 'YES') {
            const clientFilter = branch.CLIENT_FILTER._;
            if (clientFilter.InclExclOpt !== 'INCLUDE_ALL') {
              const clients = branch.CLIENT_FILTER.CLIENT.length
                ? branch.CLIENT_FILTER.CLIENT
                : [branch.CLIENT_FILTER.CLIENT];
              clients.forEach((item) => {
                vaultItems.push([profile.Name, 'CLIENT', item._text]);
              });
            }
            const backupTypeFilter = branch.BACKUP_TYPE_FILTER._;
            if (backupTypeFilter.InclExclOpt !== 'INCLUDE_ALL') {
              const backupTypes = branch.BACKUP_TYPE_FILTER.BACKUP_TYPE.length
                ? branch.BACKUP_TYPE_FILTER.BACKUP_TYPE
                : [branch.BACKUP_TYPE_FILTER.BACKUP_TYPE];
              backupTypes.forEach((item) => {
                vaultItems.push([profile.Name, 'BACKUPTYPE', item._text]);
              });
            }
            const mediaServerFilter = branch.MEDIA_SERVER_FILTER._;
            if (mediaServerFilter.InclExclOpt !== 'INCLUDE_ALL') {
              const mediaServers = branch.MEDIA_SERVER_FILTER.MEDIA_SERVER
                .length
                ? branch.MEDIA_SERVER_FILTER.MEDIA_SERVER
                : [branch.MEDIA_SERVER_FILTER.MEDIA_SERVER];
              mediaServers.forEach((item) => {
                vaultItems.push([profile.Name, 'MEDIASERVER', item._text]);
              });
            }
            const classFilter = branch.CLASS_FILTER._;
            if (classFilter.InclExclOpt !== 'INCLUDE_ALL') {
              const classes = branch.CLASS_FILTER.CLASS.length
                ? branch.CLASS_FILTER.CLASS
                : [branch.CLASS_FILTER.CLASS];
              classes.forEach((item) => {
                vaultItems.push([profile.Name, 'CLASS', item._text]);
              });
            }
            const scheduleFilter = branch.SCHEDULE_FILTER._;
            if (scheduleFilter.InclExclOpt !== 'INCLUDE_ALL') {
              const schedules = branch.SCHEDULE_FILTER.SCHEDULE.length
                ? branch.SCHEDULE_FILTER.SCHEDULE
                : [branch.SCHEDULE_FILTER.SCHEDULE];
              schedules.forEach((item) => {
                vaultItems.push([profile.Name, 'SCHEDULE', item._text]);
              });
            }
            const retentionLevelFilter = branch.RETENTION_LEVEL_FILTER._;
            if (retentionLevelFilter.InclExclOpt !== 'INCLUDE_ALL') {
              const retentions = branch.RETENTION_LEVEL_FILTER.RETENTION_LEVEL
                .length
                ? branch.RETENTION_LEVEL_FILTER.RETENTION_LEVEL
                : [branch.RETENTION_LEVEL_FILTER.RETENTION_LEVEL];
              retentions.forEach((item) => {
                vaultItems.push([profile.Name, 'RETENTION', item._text]);
              });
            }
            newVault.push(
              clientFilter.InclExclOpt,
              backupTypeFilter.InclExclOpt,
              mediaServerFilter.InclExclOpt,
              classFilter.InclExclOpt,
              scheduleFilter.InclExclOpt,
              retentionLevelFilter.InclExclOpt
            );
          } else {
            newVault.push(...Array(6));
          }
          branch = PROFILE.SELECTION.IMAGE_LOCATION_FILTERS;
          const ILF = branch._;
          newVault.push(ILF.Enabled);
          if (ILF.Enabled === 'YES') {
            const sourceVolGroupFilter = branch.SOURCE_VOL_GROUP_FILTER._;
            const volumePoolFilter = branch.VOLUME_POOL_FILTER._;
            const basicDiskFilter = branch.BASIC_DISK_FILTER._;
            const diskGroupFilter = branch.DISK_GROUP_FILTER._;
            newVault.push(
              sourceVolGroupFilter.InclExclOpt,
              volumePoolFilter.InclExclOpt,
              basicDiskFilter.InclExclOpt,
              diskGroupFilter.InclExclOpt
            );
          } else {
            newVault.push(...Array(4));
          }
          branch = PROFILE.DUPLICATION;
          const duplication = branch._;
          newVault.push(duplication.Skip);
          if (duplication.Skip === 'NO') {
            const duplicationItem = branch.DUPLICATION_ITEM._;
            const duplicationItemCopy = branch.DUPLICATION_ITEM.COPY._;
            newVault.push(
              duplication.DupPriority,
              duplication.Multiplex,
              duplication.SharedRobots,
              duplication.SortOrder,
              duplicationItem.AltReadHost,
              duplicationItem.BackupServer,
              duplicationItem.ReadDrives,
              duplicationItem.WriteDrives,
              duplicationItemCopy.Fail,
              duplicationItemCopy.Primary,
              duplicationItemCopy.Retention,
              duplicationItemCopy.ShareGroup,
              duplicationItemCopy.StgUnit,
              duplicationItemCopy.VolPool
            );
          } else {
            newVault.push(...Array(14));
          }
          newVault.push(
            catalogBackup.Skip,
            eject.Skip,
            eject.EjectMode,
            eject.EjectNotificationEmail,
            eject.Suspend,
            eject.UseRbtorVaultPrefENE,
            eject.SuspendMode,
            reportsSettings.IMFile,
            reportsSettings.Mode,
            reportsSettings.UseGlobalRptsDist
          );
          vaults.push([...newVault]);
        });
      });
    });
    return [vaults, vaultItems];
  }
}

module.exports = { Vaults };
