var debug = require("debug")("stream");
const stream = require("stream");

class TextWritable extends stream.Writable {
  constructor() {
    super();
    this.receivedItems = 0;
    this.text = "";
    this.on("finish", () => {
      debug(
        `Writable received ${this.receivedItems} items (${this.text.length}b)`
      );
      this.resolve(this.text);
    });
  }

  _write(data, _, done) {
    this.receivedItems++;
    this.text += data;
    done();
  }
}

class ObjectWritable extends stream.Writable {
  constructor() {
    super({ objectMode: true });
    this.items = [];
    this.on("finish", () => {
      debug(`Writable received ${this.items.length} items`);
      if (this.items.length == 1) this.items = this.items[0];
      this.resolve(this.items);
    });
  }
  _write(data, _, done) {
    this.items.push(data);
    done();
  }
}
class MariaDbWritable extends stream.Writable {
  constructor(connection, tableName, fields = [], batchSize = 10) {
    super({ objectMode: true });
    this.connection = connection;
    this.tableName = tableName;
    this.fields = fields;
    this.batchSize = batchSize;
    this.sql = null;
    this.items = [];
    this.promises = [];
    this.receivedItems = 0;
    this.sqlCount = 0;
    this.promises.push(
      new Promise(resolve => {
        this.finished = resolve;
      })
    );
    this.on("finish", () => {
      this.promises.push(this.doSql());
      this.finished();
      this.promises.shift();
      debug(
        `Writable received ${this.receivedItems} items (${this.sqlCount} SQL's)`
      );
      Promise.all(this.promises)
        .then(res => this.resolve(res))
        .catch(err => this.reject(err));
    });
  }
  prepareSql(row) {
    const keys = Object.keys(row);
    let sql = `INSERT INTO ${this.tableName} (`;
    sql += keys.map(key => `\`${key}\``).join(",");
    sql += ") VALUES (";
    sql += keys.map(key => `:${key}`).join(",");
    sql += ")";
    let updates = keys
      .filter(key => {
        const field = this.fields.find(field => field.name == key);
        return field !== undefined && field.update == true;
      })
      .map(key => `\`${key}\`=:${key}`)
      .join(",");
    if (updates) sql += " ON DUPLICATE KEY UPDATE " + updates;
    sql += ";";
    return sql;
  }
  doSql() {
    let res = new Promise((resolve, reject) => {
      try {
        if (this.items.length == 0) {
          resolve({ rows: null });
          return;
        }
        let data = this.items.map(item => item);
        this.items = [];
        if (this.sql === null) this.sql = this.prepareSql(data[0]);
        this.sqlCount++;
        this.connection
          .batch(this.sql, data)
          .then(res => {
            resolve({ rows: res.affectedRows });
          })
          .catch(err => {
            resolve({ code: err.code, message: err.message });
          });
      } catch (err) {
        reject({ code: err.code, message: err.message });
      }
    });
    return res;
  }
  _write(data, _, done) {
    this.receivedItems++;
    this.items.push(data);
    if (this.items.length >= this.batchSize) this.promises.push(this.doSql());
    done();
  }
}

class CommandTransform extends stream.Transform {
  constructor(delimiter = /\r?\n/) {
    super({ objectMode: true });
    this._delimiter =
      delimiter instanceof RegExp ? delimiter : new RegExp(delimiter);
    this._encoding = "utf8";
    this._buffer = "";
    this._first = true;
    this.fields = [];
    this.receivedItems = 0;
    this.receivedBytes = 0;
    this.sentItems = 0;
    this.on("finish", () => {
      debug(
        `Transform received/sent ${this.receivedItems} (${this.receivedBytes}b)/${this.sentItems} items`
      );
      if (this.resolve) this.resolve(this);
    });
  }

  _transform(chunk, encoding, done) {
    if (encoding === "buffer") {
      this._buffer += chunk.toString(this._encoding);
    } else if (encoding === this._encoding) {
      this._buffer += chunk;
    } else {
      this._buffer += Buffer.from(chunk, encoding).toString(this._encoding);
    }
    this.receivedItems++;
    this.receivedBytes += chunk.length;
    if (this._delimiter.test(this._buffer)) {
      let sections = this._buffer.split(this._delimiter);
      this._buffer = sections.pop();
      sections.forEach(section => this.parseSection(section), this);
    }
    done();
  }
  _flush(done) {
    this.parseSection(this._buffer);
    done();
  }
  parseSection(section) {
    let rows = this.createRows(section);
    rows = rows instanceof Array ? rows : [rows];
    rows
      .map(row => this.validateRow(row))
      .filter(row => row != false)
      .forEach(row => {
        this.sentItems++;
        this.push(row);
      });
  }
  createRows(section) {
    let row = {};
    this.fields.forEach(field => {
      row[field.name] = field.value;
    });
    return row;
  }
  validateRow(row) {
    return row;
  }
}

class DelimitedTransform extends CommandTransform {
  constructor(delimiter = /\r?\n/, separator = /,/) {
    super(delimiter);
    this.separator =
      separator instanceof RegExp ? separator : new RegExp(separator, "g");
  }
  createRows(section) {
    const placeHolder = "~^~";
    let row = super.createRows(section);
    const escape = new RegExp(`\\${this.separator.source}`, "g").test(section);
    if (escape)
      section = section.replace(`\\${this.separator.source}`, placeHolder);
    let match = section.split(this.separator);
    this.fields
      .filter(field => field.value === undefined)
      .forEach((field, index) => {
        if (index < match.length)
          row[field.name] =
            match[index] == ""
              ? null
              : escape
              ? match[index].replace(placeHolder, `\\${this.separator.source}`)
              : match[index];
      });
    return row;
  }
}

class LabeledTransform extends CommandTransform {
  createRows(section) {
    let row = super.createRows(section);
    this.fields.forEach(field => {
      let match =
        field.pattern instanceof RegExp ? field.pattern.exec(section) : false;
      if (match) row[field.name] = match[1] == "" ? null : match[1];
    });
    return row;
  }
}

module.exports = {
  TextWritable,
  ObjectWritable,
  MariaDbWritable,
  DelimitedTransform,
  LabeledTransform
};
