const { Transform } = require("stream");

class Item {
  fields = {};
  constructor(fields) {
    this.fields = fields;
  }
  parse = () => this.fields;
}

class LabeledItem extends Item {
  parse = text => {
    let item = {};
    this.fields.map(field => {
      let match = field.pattern.exec(text);
      item[field.name] = field.value === undefined ? match[1] : field.value;
    });
    return item;
  };
}

class DelimitedItem extends Item {
  delimiter = ",";
  constructor(fields, delimiter = ",") {
    super(fields);
    this.delimiter = delimiter;
  }
  parse = text => {
    let item = {};
    let match = text.split(this.delimiter);
    this.fields.map((field, index) => {
      item[field.name] =
        field.value === undefined ? match[index - 1] : field.value;
    });
    return item;
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

module.exports = { DelimitedStream, LabeledItem, DelimitedItem };
