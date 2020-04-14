const stream = require("stream");
const { DataDefinition } = require("./DataDefinition");
const { ConverterParams } = require("./Converters");

class TransformParams {
  constructor(converterType, converterParams, delimiter = /\r?\n/) {
    if (converterParams instanceof ConverterParams) {
      this.converterType = converterType;
      this.converterParams = converterParams;
      this.delimiter = delimiter;
    } else {
      this.converterType = converterType.converterType;
      this.converterParams = converterType.converterParams;
      this.delimiter = converterType.delimiter || delimiter;
    }
  }
}

class ConverterTransform extends stream.Transform {
  constructor(params) {
    super({ objectMode: true });
    this.delimiter = params.delimiter;
    this.converter = new params.converterType(params.converterParams);
    this._encoding = "utf8";
    this._buffer = "";
    this._first = true;
  }
  _transform(chunk, encoding, done) {
    if (encoding === "buffer") {
      this._buffer += chunk.toString(this._encoding);
    } else if (encoding === this._encoding) {
      this._buffer += chunk;
    } else {
      this._buffer += Buffer.from(chunk, encoding).toString(this._encoding);
    }
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
    const converterResult = this.converter.convert(section);
    converterResult.row.forEach((row) => this.push(row));
  }
  _flush(done) {
    if (this._buffer !== "") this.convert(this._buffer);
    done();
  }
  onStreamError = (error) => {
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
  }
  _write(data, _, done) {
    this._text += data;
    this._count++;
    if (this._limit && this._count >= this._limit) this.end(null);
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
  }
  _write(data, _, done) {
    this._objects.push(data);
    if (this._limit && this._objects.length >= this._limit)
      this.emit("result", this._objects);
    //this.end(null);
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
    if (dataDefinition instanceof DataDefinition) {
      this.dataDefinition = dataDefinition;
      this._pool = pool;
      this._batchSize = batchSize;
    }
    this._sqls = [];
    this._stack = [];
    this._results = [];
  }
  _write(data, _, done) {
    this._stack.push(data);
    if (this._stack.length >= this._batchSize) this.doSql();
    done();
  }
  _final(done) {
    if (this._stack.length) this.doSql();
    Promise.all(this._results)
      .then((res) => this.emit("result", res))
      .catch((err) => this.emit("result", err));
    done();
  }
  prepareSql(tableName, row) {
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
  doSql() {
    let resultSets = [];
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
      this._results.push(
        new Promise((resolve, reject) => {
          if (this._pool) {
            this._pool
              .batch(this._sqls[tableName], rows)
              .then((res) => {
                resolve({
                  rows: res.affectedRows,
                  warnings: res.warningStatus,
                });
              })
              .catch((err) => {
                reject({ code: err.code, message: err.message });
              });
          } else {
            resolve({ sql: this._sqls[tableName], rows: rows });
          }
        })
      );
    });
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
