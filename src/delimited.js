const { Transform } = require("stream");

class Delimited extends Transform {
  constructor(delimiter = /\r?\n/g) {
    super({ objectMode: true });

    // initialize internal values
    this._delimiter =
      delimiter instanceof RegExp ? delimiter : new RegExp(delimiter, "g");
    this._encoding = "utf8";
    this._buffer = "";
    this._first = true;
  }

  _transform(chunk, encoding, callback) {
    // convert input encoding into output encoding
    // and append to internal buffer
    if (encoding === "buffer") {
      this._buffer += chunk.toString(this._encoding);
    } else if (encoding === this._encoding) {
      this._buffer += chunk;
    } else {
      this._buffer += Buffer.from(chunk, encoding).toString(this._encoding);
    }

    if (this._delimiter.test(this._buffer)) {
      // split internal buffer by delimiter
      let sections = this._buffer.split(this._delimiter);
      // put possibly incomplete section from array back into internal buffer
      this._buffer = sections.pop();
      // push each section to readable stream in object mode
      sections.forEach(this.push, this);
    }

    callback();
  }

  _flush(callback) {
    // push remaining buffer to readable stream
    callback(null, this._buffer);
  }
}
