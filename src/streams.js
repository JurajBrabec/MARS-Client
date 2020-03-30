const dw = require("debug")("writable");
const dt = require("debug")("transform");
const stream = require("stream");

class TextWritable extends stream.Writable {
  constructor(params) {
    super();
    dw("init");
    this._text = "";
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
    this._text += data;
    done();
  }
  _final(done) {
    dw("final");
    this.emit("result", this._text);
    done();
  }
}

class ObjectWritable extends stream.Writable {
  constructor(params) {
    dw("init");
    super({ objectMode: true });
    this._objects = [];
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
    this._objects.push(data);
    done();
  }
  _final(done) {
    dw("final");
    this.emit("result", this._objects);
    done();
  }
}

class MariaDbWritable extends stream.Writable {
  constructor(params, pool, batchSize = 10) {
    dw("init");
    super({ objectMode: true });
    this.params = params;
    this._pool = pool;
    this._batchSize = batchSize;
    this._sql = null;
    this._rows = [];
    this._results = [];
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
    this._rows.push(data);
    if (this._rows.length >= this._batchSize) this.doSql();
    done();
  }
  _final(done) {
    dw("final");
    if (this._rows.length) this.doSql();
    Promise.all(this._results)
      .then(res => this.emit("result", res))
      .catch(err => this.emit("result", err));
    done();
  }
  prepareSql(row) {
    const keys = Object.keys(row);
    let sql = `INSERT INTO ${this.params.table} (`;
    sql += keys.map(key => `\`${key}\``).join(",");
    sql += ") VALUES (";
    sql += keys.map(key => `:${key}`).join(",");
    sql += ")";
    let updates = keys
      .filter(key => {
        const field = this.params.fields.find(field => field.name == key);
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
    let rows = [];
    this._rows.forEach(row => rows.push({ ...row }));
    this._rows = [];
    if (this._sql === null) this._sql = this.prepareSql(rows[0]);
    this._results.push(
      new Promise((resolve, reject) => {
        this._pool
          .batch(this._sql, rows)
          .then(res => {
            resolve({ rows: res.affectedRows, warnings: res.warningStatus });
          })
          .catch(err => {
            reject({ code: err.code, message: err.message });
          });
      })
    );
  }
}

class CommandTransform extends stream.Transform {
  constructor(params) {
    dt("init");
    super({ objectMode: true });
    params.delimiter =
      params.delimiter instanceof RegExp
        ? params.delimiter
        : new RegExp(params.delimiter);
    this.params = params;
    this._encoding = "utf8";
    this._buffer = "";
    this._first = true;
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
    if (this.params.delimiter.test(this._buffer)) {
      let sections = this._buffer.split(this.params.delimiter);
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
    this.params.fields.forEach(field => {
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
    this.params.fields.forEach(field => {
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
    this.params.fields.forEach(field => {
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

class HeaderRowsDelimitedTransform extends DelimitedTransform {
  createRows(section) {
    let rows = [];
    const bkp = [];
    this.params.fields.forEach(field => bkp.push({ ...field }));
    section.split(this.params.subSeparator).forEach((line, index) => {
      const row = super.createRows(line);
      if (index == 0) {
        this.params.fields.map(field => {
          if (row[field.name] !== undefined) field.value = row[field.name];
          return field;
        });
      } else {
        rows.push(row);
      }
    });
    this.params.fields = bkp;
    return rows;
  }
}

module.exports = {
  TextWritable,
  ObjectWritable,
  MariaDbWritable,
  DelimitedTransform,
  LabeledTransform,
  HeaderRowsDelimitedTransform
};
