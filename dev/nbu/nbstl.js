const path = require('path');
const { Actions } = require('../TextParser');
const { Row, Set } = Actions;

class SLPs {
  constructor(nbu) {
    this.process = {
      file: path.join(nbu.bin, 'admincmd', 'nbstl.exe'),
      args: ['-l'],
    };
    this.parser = [
      Set.delimiter(/\r?\n(?=[A-Za-z]+)/),
      Set.separator(' '),
      Set.external((text) => [
        text.split(/\r?\n(?=[A-Za-z]+)/).reduce(
          (array, text) => [
            ...array,
            ...text
              .split(/\r?\n/)
              .map((item) => item.trim())
              .filter((item) => item.length)
              .reduce((array, line, index) => {
                if (index) {
                  array.push(
                    [this._line, line]
                      .join(' ')
                      .split(' ')
                      .map((item) => (item === '*NULL*' ? null : item))
                  );
                } else {
                  this._line = line;
                }
                return array;
              }, []),
          ],
          []
        ),
      ]),
      Row.expect(21),
    ];
    this.tables = {
      nbstl: [
        { masterServer: nbu.masterServer, key: true },
        { slpName: 'string', key: true },
        { dataClassification: 'string' },
        { duplicationPriority: 'string' },
        { state: 'string' },
        { version: 'number' },
        { useFor: 'number' },
        { storageUnit: 'string' },
        { volumePool: 'string' },
        { mediaOwner: 'string' },
        { retentionType: 'number' },
        { retentionLevel: 'number' },
        { alternateReadServer: 'string' },
        { preserveMpx: 'number' },
        { ddoState: 'string' },
        { source: 'number' },
        { unused: 'number' },
        { operationId: 'number' },
        { operationIndex: 'number' },
        { slpWindow: 'string' },
        { targetMaster: 'string' },
        { targetMasterSlp: 'string' },
        { updated: nbu.startTime },
        { obsoleted: null },
      ],
    };
  }
}

module.exports = { SLPs };
