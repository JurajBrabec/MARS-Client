const { CommandReadable } = require("../Commands");
const {
  DelimitedConverter,
  HeaderRowsDelimitedConverter,
  LabeledConverter,
} = require("../Converters");

class NetBackupCommand extends CommandReadable {
  constructor(netBackup, params) {
    super({
      path: netBackup.params.path,
      binary: params.binary,
      args: params.args,
      transformParams: params.transformParams,
    });
    this.netBackup = netBackup;
    this.params.batchSize = params.batchSize;
    this.dbg = require("debug")("nbucommand");
  }
  get masterServer() {
    this.dbg("getMasterServer");
    return this.netBackup._masterServer;
  }
  set masterServer(name) {
    this.dbg("setMasterServer");
    this.netBackup._masterServer = name;
  }
  toDatabase(pool) {
    this.dbg("toDatabase");
    return super.toDatabase(pool, this.params.batchSize);
  }
}

function validateValue(value) {
  let result;
  switch (value) {
    case "":
    case "*NULL*":
      result = null;
      break;
    case "NOW()":
      result = this.now();
      break;
    default:
      result = value;
      break;
  }
  return result;
}
class NetBackupLabeledConverter extends LabeledConverter {
  validateValue(fieldType, value) {
    return super.validateValue(fieldType, validateValue(value));
  }
}

class NetBackupDelimitedConverter extends DelimitedConverter {
  validateValue(fieldType, value) {
    return super.validateValue(fieldType, validateValue(value));
  }
}

class NetBackupHeaderRowsDelimitedConverter extends HeaderRowsDelimitedConverter {
  validateValue(fieldType, value) {
    return super.validateValue(fieldType, validateValue(value));
  }
}

module.exports = {
  NetBackupCommand,
  NetBackupDelimitedConverter,
  NetBackupLabeledConverter,
  NetBackupHeaderRowsDelimitedConverter,
};
