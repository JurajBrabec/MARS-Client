const debug = require("debug");
const stream = require("stream");

class ConvertTransform extends stream.Transform {
  constructor(transform) {
    super({ objectMode: true });
    if (typeof transform !== "object")
      throw new Error(`Convert definition "${transform}" not an object.`);
    this.delimiter = transform.delimiter;
    if (!(this.delimiter instanceof RegExp))
      throw new Error(`Wrong delimiter definition "${trasform.delimiter}".`);
    this.expect = transform.expect || /.*/;
    if (!(this.expect instanceof RegExp))
      throw new Error(`Wrong expect definition "${trasform.expect}".`);
    this.ignore = transform.ignore || /^universe$/m;
    if (!(this.ignore instanceof RegExp))
      throw new Error(`Wrong ignore definition "${trasform.ignore}".`);
    this.converter = transform.convert;
    if (typeof this.converter !== "object")
      throw new Error(`Wrong convert definition "${transform.convert}".`);
    this._encoding = "utf8";
    this._buffer = "";
    this._first = true;
    this._sections = 0;
    this.stream = null;
    this.dbg = debug("stream:transform");
    if (this.dbg.enabled) {
      this.on("close", () => this.dbg("close"));
      this.on("data", () => this.dbg("data"));
      this.on("end", () => this.dbg("end"));
      this.on("error", () => this.dbg("error"));
      this.on("result", (result) => this.dbg("result:" + result.length));
    }
  }
  _transform(chunk, encoding, done) {
    this.dbg(`transform ${chunk.length}b`);
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
        .filter((section) => !this.ignore.test(section))
        .forEach((section) => this.convert(section));
    }
    done();
  }
  convert(section) {
    if (this.limit && this._sections >= this.limit) return false;
    this.dbg(`convert ${section.length}b`);
    try {
      if (!this.expect.test(section))
        return this.onError(new Error(`Unexpected output: ${section}`));
      const convertResult = this.converter.convert(section);
      convertResult.row.forEach((row) => this.push(row));
      this._sections++;
    } catch (err) {
      if (
        err instanceof SyntaxError ||
        err instanceof ReferenceError ||
        err instanceof TypeError
      )
        throw err;
      return this.onError(
        new Error(`Convert ERROR: section#${this._sections + 1} ${err.message}`)
      );
    }
  }
  _flush(done) {
    this.dbg(`flush ${this._buffer.length}b`);
    if (this._buffer !== "") this.convert(this._buffer);
    done();
  }
  onError = (error) => {
    if (this.stream) this.stream.end();
    this.emit("error", error);
  };
  onResult = (result) => {
    this.emit("result", result);
  };
  addStream(stream) {
    this.stream = stream.on("error", this.onError).on("result", this.onResult);
    this.pipe(this.stream);
    return this;
  }
}

class TextWritable extends stream.Writable {
  constructor() {
    super();
    this._text = "";
    this._count = 0;
    this.dbg = debug("stream:writable");
  }
  _write(data, _, done) {
    this.dbg(`write ${data.length}b`);
    this._text += data;
    this._count++;
    done();
  }
  _final(done) {
    this.dbg(`final`);
    this.emit("result", this._text);
    done();
  }
}

class ObjectWritable extends stream.Writable {
  constructor() {
    super({ objectMode: true });
    this._objects = [];
    this.dbg = debug("stream:writable");
  }
  _write(data, _, done) {
    this.dbg(`write ${data.length}b`);
    this._objects.push(data);
    done();
  }
  _final(done) {
    this.dbg(`final`);
    this.emit("result", this._objects);
    done();
  }
}

class MariaDbWritable extends stream.Writable {
  constructor(writable) {
    super({ objectMode: true });
    if (typeof writable !== "object")
      throw new Error(`Writable definition "${writable}" not an object.`);
    this.tables = writable.tables;
    this.database = writable.database;
    this.batchSize = writable.batchSize || 2048;
    this._startTime = new Date();
    this._sqls = [];
    this._stack = [];
    this._results = [];
    this.dbg = debug("stream:writable");
  }
  get duration() {
    const result = (new Date() - this._startTime) / 1000;
    return Number(result.toFixed(2));
  }
  makeProgress(delta, count) {
    if (!this.progress)
      this.progress = {
        source: "MariaDB",
        count: 0,
        done: 0,
        percent: 0,
        message: "",
        time: new Date(),
      };
    if (count) this.progress.count = count;
    this.progress.done += delta;
    this.progress.percent = Math.floor(
      (100 * this.progress.done) / this.progress.count
    );
    const message = `${this.progress.done}/${this.progress.count}`;
    if (this.progress.message !== message) {
      const time = new Date();
      this.progress.message = message;
      this.progress.time = Number(
        ((time - this.progress.time) / 1000).toFixed(2)
      );
      this.emit("progress", this.progress);
      this.progress.time = time;
    }
  }
  _write(data, _, done) {
    this.dbg("write");
    this._stack.push(data);
    if (this._stack.length >= this.batchSize) this.storeStack();
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
          if (res["sql"])
            result.messages.push({ sql: res["sql"], data: res["data"] });
          if (res["rows"]) result.rows += res.rows;
          if (res["warnings"]) result.warnings += res.warnings;
          if (res["error"]) {
            result.errors++;
            result.messages.push(res);
          }
        });
        if (!result.messages.length) delete result.messages;
        this.emit("result", result);
      })
      .catch((err) => {
        if (
          err instanceof SyntaxError ||
          err instanceof ReferenceError ||
          err instanceof TypeError
        )
          throw err;
        this.emit("error", err);
      })
      .finally(() => done());
  }
  storeStack() {
    this.dbg("storeStack");
    const resultSets = [];
    this._stack.forEach((item) => {
      Object.keys(item).forEach((tableName) => {
        Object.keys(item[tableName])
          .filter((key) => this.tables.table(tableName).field(key).ignore)
          .forEach((key) => delete item[tableName][key]);
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
      .filter((key) => this.tables.table(tableName).field(key).update)
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
      if (!this.database) return resolve({ sql: sql, data: rows });
      this.database.pool
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
          if (
            err instanceof SyntaxError ||
            err instanceof ReferenceError ||
            err instanceof TypeError
          )
            throw err;
          resolve(this.database.sqlErrorHandler(err, rows));
        })
        .finally(() => {
          if (connection) connection.release();
          this.makeProgress(1, this._results.length);
        });
    });
    return batch;
  }
}

module.exports = {
  ConvertTransform,
  TextWritable,
  ObjectWritable,
  MariaDbWritable,
};

function test() {
  const { Tables } = require("./Data");
  const { SeparatedConvert } = require("./Convert");
  const util = require("util");

  const fields = [
    { fieldName1: "string" }, //typed, default undefined
    { fieldName2: "number" }, //typed, default undefined
    { fieldName3: "float" }, //typed, default undefined
    { fieldName4: "date" }, //typed, default undefined
    { fieldName6: "textValue" }, //type derived from value
    { fieldName7: 100 }, //type derived from value
    { fieldName8: 1.5 }, //type derived from value
    { fieldName9: new Date() }, //type derived from value
    { fieldName0: /bla:(\d+)/ }, //type derived from regExp, default undefined
    { fieldNameA: "...", key: true }, //key field does not update on insert
    { fieldNameB: "...", ignore: true }, //ignored does not insert/update
  ];

  const tables = new Tables([
    { name: "tableName1", fields },
    { name: "tableName2", fields },
  ]);
  try {
    const transform = new ConvertTransform({
      delimiter: /\n/,
      expect: /\d+/,
      convert: new SeparatedConvert({ tables, separator: / / }),
    });
    transform.addStream(new MariaDbWritable({ tables }));
    transform.on("result", (result) =>
      console.log(util.inspect(result, false, null, true))
    );
    transform.end("1 2 3 4 5 6\n7 8 9 10 A 12");
  } catch (err) {
    if (
      err instanceof SyntaxError ||
      err instanceof ReferenceError ||
      err instanceof TypeError
    )
      throw err;
    console.log(`Error: ${err.message}`);
  }
}
//test();
