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
  }
  get masterServer() {
    return this.netBackup._masterServer;
  }
  set masterServer(name) {
    this.netBackup._masterServer = name;
  }
  toDatabase() {
    return super.toDatabase(this.netBackup.params.pool, this.params.batchSize);
  }
}

function validateValue(value) {
  let result;
  switch (value) {
    case "":
    case "*NULL*":
      result = null;
      break;
    case "masterServer":
      result = this.masterServer;
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
  validateValue(value) {
    return validateValue(super.validateValue(value));
  }
}

class NetBackupDelimitedConverter extends DelimitedConverter {
  validateValue(value) {
    return validateValue(super.validateValue(value));
  }
}

class NetBackupHeaderRowsDelimitedConverter extends HeaderRowsDelimitedConverter {
  validateValue(value) {
    return validateValue(super.validateValue(value));
  }
}

module.exports = {
  NetBackupCommand,
  NetBackupDelimitedConverter,
  NetBackupLabeledConverter,
  NetBackupHeaderRowsDelimitedConverter,
};
