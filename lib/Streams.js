const stream = require("stream");
const { DataDefinition } = require("./DataDefinition");
const { ConverterParams } = require("./Converters");

class TransformParams {
  constructor(
    converterType,
    converterParams,
    delimiter = /\r?\n/,
    unexpected = /^Error/
  ) {
    if (converterParams instanceof ConverterParams) {
      this.converterType = converterType;
      this.converterParams = converterParams;
      this.delimiter = delimiter;
      this.unexpected = unexpected;
    } else {
      this.converterType = converterType.converterType;
      this.converterParams = converterType.converterParams;
      this.delimiter = converterType.delimiter || delimiter;
      this.unexpected = converterType.unexpected || unexpected;
    }
  }
}

class ConverterTransform extends stream.Transform {
  constructor(params) {
    super({ objectMode: true });
    this.delimiter = params.delimiter;
    this.unexpected = params.unexpected;
    this.converter = new params.converterType(params.converterParams);
    this._encoding = "utf8";
    this._buffer = "";
    this._first = true;
    this.dbg = require("debug")("transform");
    if (this.dbg.enabled) {
      this.on("close", () => this.dbg("close"));
      this.on("data", () => this.dbg("data"));
      this.on("end", () => this.dbg("end"));
      this.on("error", () => this.dbg("error"));
      this.on("result", (result) => this.dbg("result:" + result.length));
    }
  }
  _transform(chunk, encoding, done) {
    this.dbg("transform " + chunk);
    if (encoding === "buffer") {
      this._buffer += chunk.toString(this._encoding);
    } else if (encoding === this._encoding) {
      this._buffer += chunk;
    } else {
      this._buffer += Buffer.from(chunk, encoding).toString(this._encoding);
    }
    if (this.unexpected.test(this._buffer))
      return this.onStreamError(new Error("Unexpected output:" + this._buffer));
    if (this.delimiter.test(this._buffer)) {
      let sections = this._buffer.split(this.delimiter);
      this._buffer = sections.pop();
      sections
        .filter((section) => section !== "")
        .forEach((section) => this.convert(section));
    }
    done();
  }
  convert(section) {
    this.dbg("convert");
    const converterResult = this.converter.convert(section);
    converterResult.row.forEach((row) => this.push(row));
  }
  _flush(done) {
    this.dbg("flush");
    if (this._buffer !== "") this.convert(this._buffer);
    done();
  }
  onStreamError = (error) => {
    if (this.stream) this.stream.end();
    this.emit("error", error);
  };
  onStreamResult = (result) => {
    this.emit("result", result);
  };
  addStream(stream) {
    this.stream = stream
      .on("error", this.onStreamError)
      .on("result", this.onStreamResult);
    this.pipe(this.stream);
    return this;
  }
}

class TextWritable extends stream.Writable {
  constructor(limit) {
    super();
    this._limit = limit;
    this._text = "";
    this._count = 0;
    this.dbg = require("debug")("writable");
  }
  _write(data, _, done) {
    this._text += data;
    this._count++;
    if (this._limit && this._count >= this._limit) {
      this.dbg("limit");
      this.end(null);
    }
    done();
  }
  _final(done) {
    this.emit("result", this._text);
    done();
  }
}

class ObjectWritable extends stream.Writable {
  constructor(limit) {
    super({ objectMode: true });
    this._limit = limit;
    this._objects = [];
    this.dbg = require("debug")("writable");
  }
  _write(data, _, done) {
    this._objects.push(data);
    if (this._limit && this._objects.length >= this._limit) {
      this.dbg("limit");
      this.emit("result", this._objects);
      this.emit("error", new Error("limit reached"));
      //      this.end(null);
    }
    done();
  }
  _final(done) {
    this.emit("result", this._objects);
    done();
  }
}

class MariaDbWritable extends stream.Writable {
  constructor(dataDefinition, pool, batchSize = 10) {
    super({ objectMode: true });
    this.startTime = new Date();
    this._progress = null;
    if (dataDefinition instanceof DataDefinition) {
      this.dataDefinition = dataDefinition;
      this._pool = pool;
      this._batchSize = batchSize;
    }
    this.sqlCount = 0;
    this._sqls = [];
    this._stack = [];
    this._results = [];
    this.dbg = require("debug")("writable");
  }
  get duration() {
    const result = (new Date() - this.startTime) / 1000;
    return Number(result.toFixed(2));
  }
  _write(data, _, done) {
    if (this._progress === null)
      this._progress = setInterval(
        () =>
          this.emit(
            "progress",
            Math.floor((100 * this.sqlCount) / this._results.length)
          ),
        5000
      );
    this._stack.push(data);
    if (this._stack.length >= this._batchSize) this.storeStack();
    done();
  }
  _final(done) {
    this.dbg("final");
    if (this._stack.length) this.storeStack();
    Promise.all(this._results)
      .then((results) => {
        let result = {
          duration: this.duration,
          sqls: 0,
          rows: 0,
          warnings: 0,
          errors: 0,
          messages: [],
        };
        results.forEach((res) => {
          result.sqls++;
          if (res["rows"]) result.rows += res.rows;
          if (res["warnings"]) result.warnings += res.warnings;
          if (res["error"]) {
            result.errors++;
            result.messages.push(res);
          }
        });
        if (!result.errors) delete result.messages;
        this.emit("result", result);
      })
      .catch((err) => this.emit("error", err))
      .finally(() => {
        clearInterval(this._progress);
        done();
      });
  }
  storeStack() {
    this.dbg("storeStack");
    const resultSets = [];
    this._stack.forEach((item) => {
      Object.keys(item).forEach((tableName) => {
        if (!resultSets.hasOwnProperty(tableName)) resultSets[tableName] = [];
        resultSets[tableName].push(item[tableName]);
      });
    });
    this._stack = [];
    Object.keys(resultSets).forEach((tableName) => {
      const rows = resultSets[tableName];
      if (!this._sqls[tableName])
        this._sqls[tableName] = this.prepareSql(tableName, rows[0]);
      this._results.push(this.doSql(this._sqls[tableName], rows));
    });
  }
  prepareSql(tableName, row) {
    this.dbg("prepareSql");
    const keys = Object.keys(row);
    let sql = `INSERT INTO ${tableName} (`;
    sql += keys.map((key) => `\`${key}\``).join(",");
    sql += ") VALUES (";
    sql += keys.map((key) => `:${key}`).join(",");
    sql += ")";
    let updates = keys
      .filter((key) => {
        const field = this.dataDefinition.tables
          .find((table) => table.tableName == tableName)
          .fields.find((field) => field.fieldName == key);
        return field && field.updateOnInsert === true;
      })
      .map((key) => `\`${key}\`=:${key}`)
      .join(",");
    if (updates) sql += " ON DUPLICATE KEY UPDATE " + updates;
    sql += ";";
    return sql;
  }
  doSql(sql, rows) {
    this.dbg("doSql");
    let connection;
    const batch = new Promise((resolve, reject) => {
      if (!this._pool) return resolve({ sql: sql, rows: rows });
      this._pool
        .getConnection()
        .then((conn) => {
          connection = conn;
          return conn.batch(sql, rows);
        })
        .then((res) => {
          resolve({
            rows: res.affectedRows,
            warnings: res.warningStatus,
          });
        })
        .catch((err) => {
          const result = { error: err.code, message: err.message, row: [] };
          let row = [];
          let message;
          let match;
          switch (err.errno) {
            case 1054:
              match = err.message.match(/column '(\w+)'/);
              result.message = `Unknown column '${match[1]}'`;
              break;
            case 1406:
            case 1264:
              match = err.message.match(/column '(\w+)' at row (\d+)/);
              result.row = rows[match[2] - 1];
              result.message = `'${match[1]}'='${result.row[match[1]]}'`;
              break;
            case 1366:
              match = err.message.match(
                /Incorrect (\w+) value: (\S+) for column (\S+) at row (\d+)/
              );
              result.row = rows[match[4] - 1];
              result.message = `'${match[3]}'='${match[2]}'`;
              break;
          }
          if (!result.row.length) delete result.row;
          resolve(result);
        })
        .finally(() => {
          if (connection) connection.release();
          this.sqlCount++;
        });
    });
    return batch;
  }
}

module.exports = {
  TransformParams,
  ConverterTransform,
  TextWritable,
  ObjectWritable,
  MariaDbWritable,
};

function test() {
  const DataDefinition = require("./DataDefinition");
  const {
    ConverterParams,
    LabeledConverter,
    DelimitedConverter,
    HeaderRowsDelimitedConverter,
  } = require("./Converters");

  const util = require("util");
  function converterTransformTest(
    text,
    delimiter,
    converterType,
    converterParams
  ) {
    let s = new ConverterTransform(delimiter, converterType, converterParams);
    s.addStream(new ObjectWritable());
    s.on("result", (result) =>
      console.log(util.inspect(result, false, null, true))
    );
    s.end(text);
  }
  function mariaDbWritableTest(
    text,
    delimiter,
    converterType,
    converterParams,
    pool,
    batchSize = 10
  ) {
    let s = new ConverterTransform(delimiter, converterType, converterParams);
    s.addStream(
      new MariaDbWritable(converterParams.dataDefinition, pool, batchSize)
    );
    s.on("result", (result) =>
      console.log(util.inspect(result, false, null, true))
    );
    s.end(text);
  }

  let testText = "aa=bb ff cc=dd,ee hh\naa=bb ff cc=dd,ee hh";

  let labeledDef = new DataDefinition("t1", [
    {
      fieldName: "f1",
      regExp: /aa=(\w+)/,
      updateOnInsert: true,
    },
  ]).addTable("t2", [
    {
      fieldName: "f1",
      regExp: /cc=(\w+)/,
      updateOnInsert: true,
    },
  ]);
  let delimitedDef = new DataDefinition("t1", [
    { fieldName: "f1", updateOnInsert: true },
    { fieldName: "f2", updateOnInsert: true },
  ]).addTable("t2", [
    { fieldName: "f1", updateOnInsert: true },
    { fieldName: "f2", updateOnInsert: true },
  ]);
  let labeledParams = new ConverterParams(labeledDef);
  let delimitedParams = new ConverterParams(delimitedDef, / /);

  //converterTransformTest(testText, /\r?\n/, LabeledConverter, labeledParams);
  //converterTransformTest(testText,/\r?\n/,DelimitedConverter,delimitedParams);
  //mariaDbWritableTest(testText, /\r?\n/, LabeledConverter, labeledParams);
  //mariaDbWritableTest(testText, /\r?\n/, DelimitedConverter, delimitedParams);
}

//test();
