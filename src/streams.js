const dw = require("debug")("writable");
const dt = require("debug")("transform");
const stream = require("stream");

class TextWritable extends stream.Writable {
  constructor(params) {
    super();
    dw("init");
    this.text = "";
    if (dw.enabled) {
      this.on("close", () => dw("close"));
      this.on("drain", () => dw("drain"));
      this.on("error", () => dw("error"));
      this.on("finish", () => dw("finish"));
      this.on("pipe", () => dw("pipe"));
      this.on("unpipe", () => dw("unpipe"));
      this.on("result", result => dw("result:" + result.length));
    }
  }
  _write(data, _, done) {
    this.text += data;
    done();
  }
  _final(done) {
    dw("final");
    this.emit("result", this.text);
    done();
  }
}

class ObjectWritable extends stream.Writable {
  constructor(params) {
    dw("init");
    super({ objectMode: true });
    this.objects = [];
    if (dw.enabled) {
      this.on("close", () => dw("close"));
      this.on("drain", () => dw("drain"));
      this.on("error", () => dw("error"));
      this.on("finish", () => dw("finish"));
      this.on("pipe", () => dw("pipe"));
      this.on("unpipe", () => dw("unpipe"));
      this.on("result", result => dw("result:" + result.length));
    }
  }
  _write(data, _, done) {
    this.objects.push(data);
    done();
  }
  _final(done) {
    dw("final");
    this.emit("result", this.objects);
    done();
  }
}

class MariaDbWritable extends stream.Writable {
  constructor(params, pool, batchSize = 10) {
    dw("init");
    super({ objectMode: true });
    this.params = params;
    this.pool = pool;
    this.batchSize = batchSize;
    this.table = params.table;
    this.fields = params.fields;
    this.sql = null;
    this.rows = [];
    this.results = [];
    if (dw.enabled) {
      this.on("close", () => dw("close"));
      this.on("drain", () => dw("drain"));
      this.on("error", () => dw("error"));
      this.on("finish", () => dw("finish"));
      this.on("pipe", () => dw("pipe"));
      this.on("unpipe", () => dw("unpipe"));
      this.on("result", result => dw("result:" + result.length));
    }
  }
  _write(data, _, done) {
    this.rows.push(data);
    if (this.rows.length >= this.batchSize) {
      this.results.push(this.doSql());
    }
    done();
  }
  _final(done) {
    dw("final");
    if (this.rows.length > 0) this.results.push(this.doSql());
    Promise.all(this.results)
      .then(res => {
        this.emit("result", res);
      })
      .catch(err => {
        this.emit("result", err);
      });
    done();
  }
  prepareSql(row) {
    const keys = Object.keys(row);
    let sql = `INSERT INTO ${this.table} (`;
    sql += keys.map(key => `\`${key}\``).join(",");
    sql += ") VALUES (";
    sql += keys.map(key => `:${key}`).join(",");
    sql += ")";
    let updates = keys
      .filter(key => {
        const field = this.fields.find(field => field.name == key);
        return field && field.update == true;
      })
      .map(key => `\`${key}\`=:${key}`)
      .join(",");
    if (updates) sql += " ON DUPLICATE KEY UPDATE " + updates;
    sql += ";";
    return sql;
  }
  doSql() {
    dw("sql");
    const rows = this.rows.map(row => row);
    this.rows = [];
    if (this.sql === null) this.sql = this.prepareSql(rows[0]);
    return new Promise((resolve, reject) => {
      this.pool
        .batch(this.sql, rows)
        .then(res => {
          resolve({ rows: res.affectedRows, warnings: res.warningStatus });
        })
        .catch(err => {
          reject({ code: err.code, message: err.message });
        });
    });
  }
}

class CommandTransform extends stream.Transform {
  constructor(params) {
    dt("init");
    super({ objectMode: true });
    this.params = params;
    this._encoding = "utf8";
    this._delimiter =
      params.delimiter instanceof RegExp
        ? params.delimiter
        : new RegExp(params.delimiter);
    this._buffer = "";
    this._first = true;
    this.fields = params.fields;
    if (dt.enabled) {
      this.on("close", () => dt("close"));
      this.on("data", () => dt("data"));
      this.on("end", () => dt("end"));
      this.on("error", () => dt("error"));
      this.on("drain", () => dt("drain"));
      this.on("finish", () => dt("finish"));
      this.on("pipe", () => dt("pipe"));
      this.on("unpipe", () => dt("unpipe"));
      this.on("result", result => dt("result:" + result.length));
    }
  }
  _transform(chunk, encoding, done) {
    if (encoding === "buffer") {
      this._buffer += chunk.toString(this._encoding);
    } else if (encoding === this._encoding) {
      this._buffer += chunk;
    } else {
      this._buffer += Buffer.from(chunk, encoding).toString(this._encoding);
    }
    if (this._delimiter.test(this._buffer)) {
      let sections = this._buffer.split(this._delimiter);
      this._buffer = sections.pop();
      sections
        .filter(section => section != "")
        .forEach(section => this.parseSection(section), this);
    }
    done();
  }
  _flush(done) {
    dt("flush");
    if (this._buffer !== "") this.parseSection(this._buffer);
    done();
  }
  onStreamError = error => {
    this.emit("error", error);
  };
  onStreamResult = result => {
    this.emit("result", result);
  };
  addStream(stream) {
    this.stream = stream
      .on("error", this.onStreamError)
      .on("result", this.onStreamResult);
    this.pipe(this.stream);
    return this;
  }
  parseSection(section) {
    let rows = this.createRows(section);
    rows = rows instanceof Array ? rows : [rows];
    rows
      .map(row => this.validateRow(row))
      .filter(row => row != false)
      .forEach(row => this.push(row));
  }
  createRows(section) {
    let row = {};
    this.fields.forEach(field => {
      row[field.name] = this.validateValue(field.value);
    });
    return row;
  }
  validateValue(value) {
    return value;
  }
  validateRow(row) {
    return row;
  }
}

class LabeledTransform extends CommandTransform {
  createRows(section) {
    let row = super.createRows(section);
    this.fields.forEach(field => {
      let match =
        field.pattern instanceof RegExp ? field.pattern.exec(section) : false;
      if (match) row[field.name] = this.validateValue(match[1]);
    });
    return row;
  }
  validateValue(value) {
    return value == "" ? null : value;
  }
}

class DelimitedTransform extends CommandTransform {
  constructor(params) {
    super(params);
    this._separator =
      params.separator instanceof RegExp
        ? params.separator
        : new RegExp(params.separator, "g");
  }
  createRows(section) {
    const row = super.createRows(section);
    const placeHolder = "~^~";
    const escape = new RegExp(`\\${this._separator.source}`, "g").test(section);
    if (escape)
      section = section.replace(`\\${this._separator.source}`, placeHolder);
    const match = section.split(this._separator);
    let index = 0;
    this.fields.forEach(field => {
      if (index < match.length) {
        if (field.value === undefined) {
          const value = escape
            ? match[index].replace(placeHolder, `\\${this._separator.source}`)
            : match[index];
          row[field.name] = this.validateValue(value);
          index++;
        } else {
          row[field.name] = this.validateValue(field.value);
        }
      }
    });
    return row;
  }
  validateValue(value) {
    return value == "" ? null : value;
  }
}

module.exports = {
  TextWritable,
  ObjectWritable,
  MariaDbWritable,
  DelimitedTransform,
  LabeledTransform
};
