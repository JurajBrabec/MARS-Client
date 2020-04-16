const { ConverterParams } = require("../Converters");
const { DataDefinition } = require("../DataDefinition");
const { TransformParams } = require("../Streams");
const {
  NetBackupCommand,
  NetBackupDelimitedConverter,
} = require("./NetBackup");

class BpplClients extends NetBackupCommand {
  constructor(netBackup) {
    super(netBackup, {
      binary: "bin/admincmd/bpplclients",
      args: ["-allunique", "-l"],
      batchSize: 1024,
      transformParams: new TransformParams({
        converterType: NetBackupDelimitedConverter,
        delimiter: /^CLIENT /m,
        converterParams: new ConverterParams({
          separator: /\s/,
          dataDefinition: new DataDefinition({
            tableName: "bpplpclients",
            fields: [
              {
                fieldName: "masterServer",
                fieldType: "string",
                fixedValue: netBackup.masterServer,
              },
              { fieldName: "name", fieldType: "string" },
              {
                fieldName: "architecture",
                fieldType: "string",
                updateOnInsert: true,
              },
              { fieldName: "os", fieldType: "string", updateOnInsert: true },
              {
                fieldName: "priority",
                fieldType: "string",
                updateOnInsert: true,
              },
              { fieldName: "u1", fieldType: "string" },
              { fieldName: "u2", fieldType: "string" },
              { fieldName: "u3", fieldType: "string" },
              {
                fieldName: "updated",
                fieldType: "datetime",
                fixedValue: netBackup.now(),
                updateOnInsert: true,
              },
              {
                fieldName: "obsoleted",
                fieldType: "datetime",
                fixedValue: null,
                updateOnInsert: true,
              },
            ],
          }),
        }),
      }),
    });
  }
}
module.exports = { BpplClients };
