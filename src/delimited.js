const { Transform } = require("stream");

class Row {
  fields = {};
  parse = text => this.fields;
}

class LabeledRow extends Row {
  parse = text => {
    let row = {};
    this.fields.map(field => {
      let match = field.pattern.exec(text);
      if (match !== null)
        row[field.name] = field.value === undefined ? match[1] : field.value;
    });
    if (row == {}) row = undefined;
    return row;
  };
}

class DelimitedRow extends Row {
  delimiter = ",";
  constructor(delimiter = ",") {
    super();
    this.delimiter = delimiter;
  }
  parse = text => {
    let row = {};
    let match = text.split(this.delimiter);
    this.fields.map((field, index) => {
      if (index < match.length)
        row[field.name] =
          field.value === undefined ? match[index - 1] : field.value;
    });
    return row;
  };
}

class DelimitedStream extends Transform {
  constructor(delimiter = /\r?\n/g) {
    super({ objectMode: true });
    this._delimiter =
      delimiter instanceof RegExp ? delimiter : new RegExp(delimiter, "g");
    this._encoding = "utf8";
    this._buffer = "";
    this._first = true;
  }

  _transform(chunk, encoding, callback) {
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
      sections.forEach(this.push, this);
    }
    callback();
  }

  _flush(callback) {
    callback(null, this._buffer);
  }
}

module.exports = { DelimitedStream, LabeledRow, DelimitedRow };
