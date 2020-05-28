const debug = require("debug");
const stream = require("stream");

class Parser {
  constructor(prop) {
    this.dbg = debug(this.constructor.name);
    this.delimiter = "\n";
    this.elapsed = 0;
    this.escapeChar = `\\`;
    this.quoteChar = `"`;
    this.separator = ",";
    if (typeof prop === "function") this._parse = prop.bind(this);
    if (typeof prop === "string") this.set(prop);
    return this;
  }
  startClock = () => (this._started = new Date());
  stopClock = () => (this.elapsed += new Date() - this._started);

  isRow = (v) => Array.isArray(v) && this.isField(v[0]);
  isField = (v) => !Array.isArray(v);
  isMatch = (a, b) => (a instanceof RegExp ? a.test(b) : a == b);

  _check() {
    const f = (i) => {
      this._p(i);
      return this.isField(i) || i.map(f);
    };
    f(this.items);
    const { t, g, l, rMax, fMax } = this._pointer;
    this.fields = fMax;
    this.groups = g;
    this.level = l;
    this.rows = rMax;
    this.rowsTotal = t;
    return this;
  }
  _finished = (result) => {
    this.stopClock();
    this.dbg(
      `Level:${this.level} Groups:${this.groups} Rows:${this.rowsTotal} (${this.rows}/group) Fields:${this.fields} Duration:${this.elapsed}ms`
    );
    return result;
  };
  _p(arg) {
    if (arg === this.items || !this._pointer)
      this._pointer = { l: 0, r: 0, f: 0, t: 0, g: 0 };
    if (arg !== undefined) {
      if (this.isRow(arg)) {
        if (!this._pointer.r) this._pointer.g++;
        //        if (!this._pointer.r) this._pointer.l++;
        this._pointer.r++;
        this._pointer.t++;
        this._pointer.f = 0;
      } else if (this.isField(arg)) {
        if (!this._pointer.r) this._pointer.r = 1;
        this._pointer.f++;
      } else {
        this._pointer.l++;
        this._pointer.r = 0;
      }
      this._pointer.fMax = Math.max(this._pointer.fMax || 0, this._pointer.f);
      this._pointer.rMax = Math.max(this._pointer.rMax || 0, this._pointer.r);
    }
    return this._pointer;
  }

  //_PARSE() - override this function in descendant classes
  _parse = (source) => source.get();
  //DELIMITER(string/regexp) - set expression for SPLI task
  delimited = (delimiter) => {
    this.delimiter = delimiter;
    return this;
  };
  //ESCAPED(char) - set character for ESCAPE task
  escaped = (escapeCharacter) => {
    this.escapeChar = escapeCharacter;
    return this;
  };
  //QUOTED(char) - set character for [UN]QUOTE task
  quoted = (quoteCharacter) => {
    this.quoteChar = quoteCharacter;
    return this;
  };
  //SEPARATED(char) - set characted for SEPARATE task
  separated = (separatorCharacter) => {
    this.separator = separatorCharacter;
    return this;
  };

  //SET(string) - first step : set text to parse
  set = (text) => {
    this.startClock();
    if (text) this.items = [[text]];
    return this._check();
  };

  //PARSE() - main function
  parse = (text) => this.set(text)._parse(this);

  //ASSIGN(callback) - assign all rows against callback, retrieving results
  assign(target) {
    const callback = target.assign ? target.assign : target;
    const tables = [];
    this.get(false).forEach((row) => tables.push(callback(row)));
    return this._finished(tables);
  }
  //GET() - last step : get parsed text as rows of values
  get(finish = true) {
    let rows = [];
    const f = (i) => {
      if (this.isRow(i)) rows.push(i);
      return this.isField(i) || i.map(f);
    };
    f(this.items);
    return finish ? this._finished(rows) : rows;
  }
  //MATCH(callback) - match all fields against callback, retrieving results
  match(target) {
    const callback = target.match ? target.match : target;
    const tables = [];
    this.get(false).forEach((row) =>
      row.forEach((field) => tables.push(callback(field)))
    );
    return this._finished(tables);
  }
  //CHECK() - check if all rows have same number of fields
  check() {
    const f = (i) => {
      this._p(i);
      if (this.isRow(i)) {
        if (this.fields != i.length)
          throw `Wrong field count ${i.length} at row ${
            this._p().r
          } (Should be ${this.fields}).`;
      }
      return this.isField(i) || i.map(f);
    };
    f(this.items);
    return this;
  }
  // EXPECT(number,[number]) - compare field count [between]
  // EXPECT(string/regexp) - match value contents
  expect(arg1, arg2) {
    const min = arg1;
    const max = typeof arg2 == "number" ? arg2 : arg1;
    const type = typeof arg1;
    const f = (i) => {
      this._p(i);
      if (type == "number") {
        let count;
        if (this.isField(i)) count = 1;
        if (this.isRow(i)) count = i.length;
        if (count === undefined) return i.map(f);
        if (count >= min && count <= max) return;
        throw `Unexpected field count ${count} at row ${
          this._p().r
        } (expecting ${min}${arg2 ? ` to ${max}` : ``})`;
      } else {
        if (!this.isField(i)) return i.map(f);
        if (this.isMatch(arg1, i)) return;
        throw `Unexpected value "${i.split("\n")[0]}" at row ${
          this._p().r
        } field ${this._p().f} (expecting "${arg1}").`;
      }
    };
    f(this.items);
    return this;
  }
  // REJECT(string/regexp) - opposite to EXPECT
  reject(arg1) {
    const f = (i) => {
      this._p(i);
      if (!this.isField(i)) return i.map(f);
      if (!this.isMatch(arg1, i)) return;
      throw `Rejecting value "${i.split("\n")[0]}" at row ${
        this._p().r
      } field ${this._p().f}.`;
    };
    f(this.items);
    return this;
  }

  // POP() - remove last row
  pop() {
    let row;
    const f = (i) => {
      this._p(i);
      if (!this.isRow(i)) return this.isField(i) ? i : i.map(f);
      if (this._p().r < this.rows) return i.map(f);
      row = i;
      return [];
    };
    this.items = f(this.items);
    this.filter();
    return row;
  }
  // SEPARATE(string/regexp) - separate rows to fields by separator
  separate(separator = this.separator) {
    const s = separator;
    const q = this.quoteChar;
    const p = `(${q}.*?${q}|[^${q}${s}\s]+)(?=\s*${s}|\s*$)`;
    const r = new RegExp(p, "gm");
    const f = (i) => (this.isField(i) ? i.match(r) : i.map(f));
    this.items = f(this.items);
    return this._check();
  }
  // SHIFT() - remove first row
  shift() {
    let row;
    const f = (i) => {
      this._p(i);
      if (!this.isRow(i)) return this.isField(i) ? i : i.map(f);
      if (this._p().r > 1) return i.map(f);
      row = i;
      return [];
    };
    this.items = f(this.items);
    this.filter();
    return row;
  }
  // SPLIT(string/regexp) - split rows to fields by separator
  split(delimiter = this.delimiter) {
    const f = (i) => (this.isField(i) ? i.split(delimiter) : i.map(f));
    this.items = f(this.items);
    return this._check();
  }
  // UNPIVOT() - prepend first row to other rows
  unpivot() {
    let row;
    const f = (i) => {
      this._p(i);
      if (!this.isRow(i)) return this.isField(i) ? i : i.map(f);
      if (this._p().r > 1) return [...row, ...i];
      row = i;
      return [];
    };
    this.items = f(this.items);
    return this.filter();
  }

  // FILTER(text) - remove matched values
  filter(arg1 = "") {
    const f = (i) =>
      this.isField(i)
        ? this.isMatch(arg1, i)
          ? ""
          : i
        : i.map(f).filter((i) => i.length);
    this.items = f(this.items);
    return this._check();
  }

  // LCASE() - lower-case values
  lcase() {
    const f = (i) => (this.isField(i) ? i.toLowerCase() : i.map(f));
    this.items = f(this.items);
    return this;
  }
  // QUOTE() - quote values
  quote(quoteChararcter = this.quoteChar) {
    const q = quoteChararcter;
    const r1 = new RegExp(`^${q}`);
    const r2 = new RegExp(`${q}$`);
    const f = (i) =>
      this.isField(i)
        ? (r1.test(i) ? "" : q) + i + (r2.test(i) ? "" : q)
        : i.map(f);
    this.items = f(this.items);
    return this;
  }
  // REPLACE(string/regexp,[string]) - replace matchet values [remove]
  replace(arg1, arg2 = "") {
    const f = (i) => (this.isField(i) ? i.replace(arg1, "") : i.map(f));
    this.items = f(this.items);
    return this.filter();
  }
  // TRIM() - trim values
  trim() {
    const f = (i) => (this.isField(i) ? i.trim() : i.map(f));
    this.items = f(this.items);
    return this.filter();
  }
  // UCASE() - upper-case values
  ucase() {
    const f = (i) => (this.isField(i) ? i.toUpperCase() : i.map(f));
    this.items = f(this.items);
    return this;
  }
  // UNQUOTE() - trim quote characters
  unquote(quoteChararcter = this.quoteChar) {
    const q = quoteChararcter;
    const r = new RegExp(`^${q}|${q}$`, "g");
    return this.replace(r, "");
  }
}

const myTransform = new stream.Transform({
  defaultEncoding: "utf8",
  objectMode: true,
  write(chunk, encoding, callback) {
    this.push(JSON.stringify(chunk), encoding);
    callback();
  },
});

class Transform extends stream.Transform {
  constructor(options) {
    super(options);
    this.parser = new Parser(options.parser);
  }
  _transform(chunk, encoding, callback) {
    this.parser.parse(chunk).map((row) => this.push(row));
    callback();
  }
  _flush(callback) {
    callback();
  }
}

module.exports = { Parser, Transform };