const emitter = require("./Emitter");
const readable = require("./Readable");
const parser = require("./Parser");
const writable = require("./Writable");

module.exports = {
  emitter,
  readable,
  parser,
  writable,
  Emitter: emitter.Command,
  EmitterFunction: emitter.Function,
  EmitterFile: emitter.File,
  EmitterProcess: emitter.Process,
  EmitterSql: emitter.Sql,
  Readable: readable.Readable,
  ReadableFunction: readable.Function,
  ReadableFile: readable.File,
  ReadableProcess: readable.Process,
  ReadableSql: readable.Sql,
  Parser: parser.Parser,
  TransformParser: parser.Transform,
  Writable: writable.Writable,
  WritableFunction: writable.Function,
  File: writable.File,
  WritableSql: writable.Sql,
};
