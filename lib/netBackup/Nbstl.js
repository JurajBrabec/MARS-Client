const { ConverterParams } = require("../Converters");
const { DataDefinition } = require("../DataDefinition");
const { TransformParams } = require("../Streams");
const {
  NetBackupCommand,
  NetBackupHeaderRowsDelimitedConverter,
} = require("./NetBackup");

class Nbstl extends NetBackupCommand {
  constructor(netBackup) {
    super(netBackup, {
      binary: "bin/admincmd/nbstl",
      args: ["-l"],
      batchSize: 128,
      transformParams: new TransformParams({
        converterType: NetBackupHeaderRowsDelimitedConverter,
        delimiter: /^(?=[A-Za-z]+)/m,
        converterParams: new ConverterParams({
          separator: /\s/,
          subSeparator: /\r?\n\s*/,
          dataDefinition: new DataDefinition({
            tableName: "nbstl",
            fields: [
              {
                fieldName: "masterServer",
                fieldType: "string",
                fixedValue: netBackup.masterServer,
              },
              { fieldName: "slpName", fieldType: "string" },
              {
                fieldName: "dataClassification",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "duplicationPriority",
                fieldType: "string",
                updateOnInsert: true,
              },
              { fieldName: "state", fieldType: "string", updateOnInsert: true },
              {
                fieldName: "version",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "useFor",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "storageUnit",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "volumePool",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "mediaOwner",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "retentionType",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "retentionLevel",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "alternateReadServer",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "preserveMpx",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "ddoState",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "source",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "unused",
                fieldType: "number",
                updateOnInsert: true,
              },
              {
                fieldName: "operationId",
                fieldType: "number",
                updateOnInsert: true,
              },
              { fieldName: "operationIndex", fieldType: "number" },
              {
                fieldName: "slpWindow",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "targetMaster",
                fieldType: "string",
                updateOnInsert: true,
              },
              {
                fieldName: "targetMasterSlp",
                fieldType: "string",
                updateOnInsert: true,
              },
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
module.exports = { Nbstl };
