const debug = require("debug");
const { CommandReadable, FileReadable } = require("../Command");
const {
  SeparatedConvert,
  MultiPartSeparatedConvert,
  LabeledConvert,
} = require("../Convert");

class NetBackupFile extends FileReadable {
  constructor(netBackup, command) {
    super({
      path: netBackup.path,
      file: command.file,
      transform: command.transform,
    });
    this.netBackup = netBackup;
    this.dbg = debug("file:nbu");
  }
}

class NetBackupCommand extends CommandReadable {
  constructor(netBackup, command) {
    super({
      path: netBackup.path,
      binary: command.binary,
      args: command.args,
      transform: command.transform,
    });
    this.netBackup = netBackup;
    this.dbg = debug("command:nbu");
  }
  get masterServer() {
    this.dbg("getMasterServer");
    return this.netBackup._masterServer;
  }
  set masterServer(name) {
    this.dbg("setMasterServer");
    this.netBackup._masterServer = name;
  }
}
class NetBackupLabeledConvert extends LabeledConvert {
  validate(item) {
    return typeof item === "string" ? item.replace(/\*NULL\*/g, "null") : item;
  }
}

class NetBackupSeparatedConvert extends SeparatedConvert {
  validate(item) {
    return typeof item === "string" ? item.replace(/\*NULL\*/g, "null") : item;
  }
}

class NetBackupMultiPartSeparatedConvert extends MultiPartSeparatedConvert {
  validate(item) {
    return typeof item === "string" ? item.replace(/\*NULL\*/g, "null") : item;
  }
}

module.exports = {
  NetBackupCommand,
  NetBackupFile,
  NetBackupLabeledConvert,
  NetBackupSeparatedConvert,
  NetBackupMultiPartSeparatedConvert,
};
