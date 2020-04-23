const debug = require("debug");
const { Tables } = require("./Data");

class Convert {
  constructor(convert) {
    if (typeof convert !== "object")
      throw new Error(`Convert definition "${convert}" not an object.`);
    this.tables =
      convert.tables instanceof Tables
        ? convert.tables
        : new Tables(convert.tables);
    if (!(this.tables instanceof Tables))
      throw new Error(`Wrong convert definition "${convert}".`);
    this.dbg = debug("convert");
  }
  convert(text) {
    let result = { row: [] };
    let row = this.parse(text);
    if (this.validate(row)) result.row.push(row);
    return result;
  }
  parse() {
    return this.tables.row();
  }
  validate(item) {
    return item;
  }
}
class LabeledConvert extends Convert {
  constructor(convert) {
    super(convert);
    this.dbg = debug("convert:labeled");
  }
  parse(text) {
    const row = super.parse();
    this.tables.match(row, this.validate(text));
    return row;
  }
}
class SeparatedConvert extends Convert {
  constructor(convert) {
    super(convert);
    this.separator = convert.separator;
    if (!(this.separator instanceof RegExp))
      throw new Error(`Wrong separator definition "${convert.separator}".`);
    this.dbg = debug("convert:separated");
  }
  parse(text) {
    const row = super.parse();
    const placeHolder = "~^~";
    const source = this.separator.source;
    const escape = new RegExp(`\\${source}`, "g").test(text);
    if (escape) text = text.replace(`\\${source}`, placeHolder);
    const match = text.split(this.separator).map((item) => this.validate(item));
    if (escape) match.map((item) => item.replace(placeHolder, `\\${source}`));
    this.tables.assign(row, match);
    return row;
  }
}
class MultiPartSeparatedConvert extends SeparatedConvert {
  constructor(convert) {
    super(convert);
    this.delimiter = convert.delimiter;
    if (!(this.delimiter instanceof RegExp))
      throw new Error(`Wrong delimiter definition "${convert.delimiter}".`);
    this.dbg = debug("convert:multipart");
  }
  convert(text) {
    let result = { row: [] };
    let rows = this.parse(text);
    if (!(rows instanceof Array)) rows = [rows];
    rows.forEach((row) => this.validate(row) && result.row.push(row));
    return result;
  }
  parse(text) {
    let rows = [];
    let firstLine;
    text
      .split(this.delimiter)
      .filter((line) => line !== "")
      .forEach((line) => {
        if (firstLine) {
          const row = super.parse(
            [firstLine, line].join(this.separator.source)
          );
          rows.push(row);
        } else {
          firstLine = line;
        }
      });
    return rows;
  }
}

module.exports = {
  Convert,
  LabeledConvert,
  SeparatedConvert,
  MultiPartSeparatedConvert,
};

function test() {
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
    const convert = new SeparatedConvert({
      tables,
      separator: / /,
      delimiter: /\n/,
    });
    const result = convert.convert("1 2 3 4 5 6");
    console.log(util.inspect(result, false, null, true));
  } catch (err) {
    if (err instanceof SyntaxError || err instanceof ReferenceError) throw err;
    console.log("Test ERROR:");
    console.log(err);
  }
}
//test();
