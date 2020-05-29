const emitter = require("./Emitter");
const readable = require("./Readable");
const parser = require("./Parser");
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
  TransformParser: parser.Transform,
  writable,
  Writable: writable.Writable,
  WritableFile: writable.File,
  WritableSql: writable.Sql,
};
