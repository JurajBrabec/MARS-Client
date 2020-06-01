const emitter = require("./Emitter");
const readable = require("./Readable");
const parser = require("./Parser");
const transform = require("./Transform");
const writable = require("./Writable");

module.exports = {
  emitter,
  Emitter: emitter.Emitter,
  EmitterFile: emitter.File,
  EmitterProcess: emitter.Process,
  EmitterSql: emitter.Sql,
  readable,
  Readable: readable.Readable,
  ReadableFile: readable.File,
  ReadableProcess: readable.Process,
  ReadableSql: readable.Sql,
  parser,
  Parser: parser.Parser,
  transform,
  TransformParser: transform.Transform,
  BatchInsert: transform.BatchInsert,
  BufferedBatchInsert: transform.BufferedBatchInsert,
  writable,
  Writable: writable.Writable,
  WritableFile: writable.File,
  WritableSql: writable.Sql,
};
