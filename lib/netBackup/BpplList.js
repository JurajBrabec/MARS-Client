const path = require('path');
const { Actions } = require('../TextParser');
const { Column, Set } = Actions;

class Policies {
  constructor(netBackup) {
    this.process = {
      file: path.join(netBackup.bin, 'admincmd', 'bppllist.exe'),
      args: ['-allpolicies'],
    };
    this.parser = [
      Set.delimiter(/(\r?\n(?=CLASS))/),
      Set.separator(' '),
      Column.expect(/^CLASS/),
      Set.external(this.parse),
    ];
    this.tables = {
      bppllist_policies: [
        { masterServer: netBackup.masterServer, key: true },
        { name: 'string', key: true },
        { internalname: 'string' },
        { options: 'number' },
        { protocolversion: 'number' },
        { timeZoneOffset: 'number' },
        { auditReason: 'string' },
        { policyType: 'number' },
        { followNfsMount: 'number' },
        { clientCompress: 'number' },
        { jobPriority: 'number' },
        { proxyClient: 'string' },
        { clientEncrypt: 'number' },
        { dr: 'number' },
        { maxJobsPerClient: 'number' },
        { crossMountPoints: 'number' },
        { maxFragSize: 'number' },
        { active: 'number' },
        { tir: 'number' },
        { blockLevelIncrementals: 'number' },
        { extSecInfo: 'number' },
        { individualFileRestore: 'number' },
        { streaming: 'number' },
        { frozenImage: 'number' },
        { backupCopy: 'number' },
        { effectiveDate: 'number' },
        { classId: 'string' },
        { backupCopies: 'number' },
        { checkPoints: 'number' },
        { checkPointInterval: 'number' },
        { unused: 'number' },
        { instantRecovery: 'number' },
        { offHostBackup: 'number' },
        { alternateClient: 'number' },
        { dataMover: 'number' },
        { dataMoverType: 'number' },
        { bmr: 'number' },
        { lifeCycle: 'number' },
        { granularRestore: 'number' },
        { jobSubType: 'number' },
        { vm: 'number' },
        { ignoreCsDedup: 'number' },
        { exchangeDbSource: 'number' },
        { generation: 'number' },
        { applicationDiscovery: 'number' },
        { discoveryLifeTime: 'number' },
        { fastBackup: 'number' },
        { optimizedBackup: 'number' },
        { clientListType: 'number' },
        { selectListType: 'number' },
        { appConsistent: 'number' },
        { Key: 'string' },
        { res: 'string' },
        { pool: 'string' },
        { foe: 'string' },
        { shareGroup: 'string' },
        { dataClassification: 'string' },
        { hypervServer: 'string' },
        { names: 'string' },
        { bcmd: 'string' },
        { rcmd: 'string' },
        { applicationDefined: 'string' },
        { oraBkupDataFileArgs: 'string' },
        { oraBkupArchLogArgs: 'string' },
        { include: 'string' },
        { updated: netBackup.startTime },
        { obsoleted: null },
      ],
      bppllist_clients: [
        { masterServer: netBackup.masterServer, key: true },
        { policyName: 'string', key: true },
        { name: 'string', key: true },
        { architecture: 'string' },
        { os: 'string' },
        { field1: 'number' },
        { field2: 'number' },
        { field3: 'number' },
        { field4: 'number' },
        { updated: netBackup.startTime },
        { obsoleted: null },
      ],
      bppllist_schedules: [
        { masterServer: netBackup.masterServer, key: true },
        { policyName: 'string', key: true },
        { name: 'string', key: true },
        { backupType: 'number' },
        { multiplexingCopies: 'number' },
        { frequency: 'number' },
        { retentionLevel: 'number' },
        { reserved1: 'number' },
        { reserved2: 'number' },
        { reserved3: 'number' },
        { alternateReadServer: 'string' },
        { maxFragmentSize: 'number' },
        { calendar: 'number' },
        { copies: 'number' },
        { foe: 'number' },
        { synthetic: 'number' },
        { pfiFastRecover: 'number' },
        { priority: 'number' },
        { storageService: 'number' },
        { checksumDetection: 'number' },
        { calDates: 'string' },
        { calRetries: 'string' },
        { calDayOfWeek: 'string' },
        { win_sun_start: 'number' },
        { win_sun_duration: 'number' },
        { win_mon_start: 'number' },
        { win_mon_duration: 'number' },
        { win_tue_start: 'number' },
        { win_tue_duration: 'number' },
        { win_wed_start: 'number' },
        { win_wed_duration: 'number' },
        { win_thu_start: 'number' },
        { win_thu_duration: 'number' },
        { win_fri_start: 'number' },
        { win_fri_duration: 'number' },
        { win_sat_start: 'number' },
        { win_sat_duration: 'number' },
        { schedRes: 'string' },
        { schedPool: 'string' },
        { schedRL: 'string' },
        { schedFoe: 'string' },
        { schedSg: 'string' },
        { updated: netBackup.startTime },
        { obsoleted: null },
      ],
    };
  }
  parse = (text) => {
    const clients = [];
    const policies = [];
    const schedules = [];
    text.split(/\r?\n(?=CLASS)/).map((text) => {
      let match;
      let o = { CLASS: [], INFO: [], RES: [], POOL: [], FOE: [] };
      //ARRAY items
      const r1 = /^(CLASS|INFO|RES|POOL|FOE) ?(.+)?$/gm;
      match = text.match(r1) || [];
      match.reduce((object, line) => {
        const items = line
          .split(' ')
          .map((item) => (item === '*NULL*' ? null : item));
        const key = items.shift();
        object[key] = items;
        return object;
      }, o);
      //LINE items
      const r2 = /^(NAMES|KEY|BCMD|RCMD|SHAREGROUP|DATACLASSIFICATION|APPLICATIONDEFINED|HYPERVSERVER|ORABKUPDATAFILEARGS|ORABKOPARCHLOGARGS) ?(.+)?$/gm;
      match = text.match(r2) || [];
      match.reduce((object, line) => {
        const i = line.indexOf(' ');
        const key = i > 0 ? line.slice(0, i) : line;
        const item = i > 0 ? line.slice(i + 1) : undefined;
        object[key] = item === '*NULL*' ? null : item;
        return object;
      }, o);
      //MULTI-LINE items
      o.INCLUDE = [];
      const r3 = /^INCLUDE ?(.+)?$/gm;
      match = text.match(r3) || [];
      match.reduce((object, line) => {
        const items = line
          .split(' ')
          .map((item) => (item === '*NULL*' ? null : item));
        const key = items.shift();
        object[key].push(...items);
        return object;
      }, o);
      //MULTI-ARRAY items
      o.CLIENT = [];
      const r4 = /^CLIENT ?(.+)?$/gm;
      match = text.match(r4) || [];
      match.reduce((object, line) => {
        const items = line
          .split(' ')
          .map((item) => (item === '*NULL*' ? null : item));
        const key = items.shift();
        object[key].push(items);
        return object;
      }, o);
      //MULTI-MULTI-ARRAY items
      o.SCHED = [];
      const r5 = /^SCHED(CALDATES|CALENDAR|CALDAYOFWEEK|WIN|RES|POOL|RL|FOE|DSG)? ?(.+)?$/gm;
      text
        .split(/^(?=SCHED )/gm)
        .slice(1)
        .reduce((object, schedule) => {
          const match = schedule.match(r5) || [];
          const s = match.reduce(
            (object, line) => {
              const items = line
                .split(' ')
                .map((item) => (item === '*NULL*' ? null : item));
              const key = items.shift();
              object[key] = items;
              return object;
            },
            {
              SCHED: [],
              SCHEDCALDATES: [],
              SCHEDCALENDAR: [],
              SCHEDCALDAYOFWEEK: [],
              SCHEDWIN: [],
              SCHEDRES: [],
              SCHEDPOOL: [],
              SCHEDRL: [],
              SCHEDFOE: [],
              SCHEDSG: [],
            }
          );
          object.SCHED.push(s);
          return object;
        }, o);

      policies.push([
        ...o.CLASS,
        ...o.INFO,
        o.KEY,
        o.RES[0],
        o.POOL[0],
        o.FOE[0],
        o.SHAREGROUP,
        o.DATACLASSIFICATION,
        o.HYPERVSERVER,
        o.NAMES,
        o.BCMD,
        o.RCMD,
        o.APPLICATIONDEFINED,
        o.ORABKUPDATAFILEARGS,
        o.ORABKOPARCHLOGARGS,
        o.INCLUDE.join(),
      ]);
      o.CLIENT.map((client) => clients.push([o.CLASS[0], ...client]));
      o.SCHED.map((schedule) =>
        schedules.push([
          o.CLASS[0],
          ...schedule.SCHED,
          schedule.SCHEDCALDATES[0],
          schedule.SCHEDCALENDAR[0],
          schedule.SCHEDCALDAYOFWEEK[0],
          ...schedule.SCHEDWIN,
          schedule.SCHEDRES[0],
          schedule.SCHEDPOOL[0],
          schedule.SCHEDRL[0],
          schedule.SCHEDFOE[0],
          schedule.SCHEDSG[0],
        ])
      );
    });
    return [policies, clients, schedules];
  };
}

module.exports = { Policies };
