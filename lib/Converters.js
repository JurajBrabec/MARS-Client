const { DataDefinition } = require("./DataDefinition");

// new ConverterParams(dataDefintion,separator)
// new ConverterParams({dataDefintion:dataDefintion,separator:separator})
class ConverterParams {
  constructor(dataDefinition, separator = /,/, subSeparator = /,/) {
    if (dataDefinition instanceof DataDefinition) {
      this.dataDefinition = dataDefinition;
      this.separator = separator;
      this.subSeparator = subSeparator;
    } else {
      this.dataDefinition = dataDefinition ? dataDefinition.dataDefinition : [];
      this.separator = dataDefinition
        ? dataDefinition.separator || separator
        : separator;
      this.subSeparator = dataDefinition
        ? dataDefinition.subSeparator
        : subSeparator;
    }
  }
}

class Converter {
  constructor(params) {
    this.params = params;
  }
  convert(text) {
    let result = { row: [] };
    if (!this.params || this.params.dataDefinition.length == 0) return result;
    let row = this.parse(text);
    if (this.validateRow(row)) result.row.push(row);
    return result;
  }
  parse(text) {
    const row = {};
    this.params.dataDefinition.tables.forEach((table) => {
      if (!row[table.tableName]) row[table.tableName] = {};
      table.fields.forEach((field) => {
        row[table.tableName][field.fieldName] = this.validateValue(
          field.fixedValue
        );
      });
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

class LabeledConverter extends Converter {
  parse(text) {
    const row = super.parse(text);
    this.params.dataDefinition.tables.forEach((table) => {
      table.fields
        .filter((field) => field.regExp)
        .forEach((field) => {
          let match = text.match(field.regExp);
          if (match) {
            field.regExp.global || match.shift();
            row[table.tableName][field.fieldName] = this.validateValue(
              match.join("\n")
            );
          }
        });
    });
    return row;
  }
  validateValue(value) {
    return value == "" ? null : value;
  }
}

class DelimitedConverter extends Converter {
  parse(text) {
    const row = super.parse(text);
    const separator =
      this.params.separator instanceof RegExp
        ? this.params.separator
        : new RegExp(params.separator, "g");
    const placeHolder = "~^~";
    const escape = new RegExp(`\\${separator.source}`, "g").test(text);
    if (escape) text = text.replace(`\\${separator.source}`, placeHolder);
    const match = text.split(separator);
    let index = 0;
    this.params.dataDefinition.tables.forEach((table) => {
      table.fields.forEach((field) => {
        let value;
        if (field.fixedValue !== undefined) {
          value = field.fixedValue;
        } else if (index < match.length) {
          value = escape
            ? match[index].replace(placeHolder, `\\${separator.source}`)
            : match[index];
          index++;
        }
        row[table.tableName][field.fieldName] = this.validateValue(value);
      });
    });
    return row;
  }
  validateValue(value) {
    return value == "" ? null : value;
  }
}

class HeaderRowsDelimitedConverter extends DelimitedConverter {
  convert(text) {
    let result = { row: [] };
    if (!this.params || this.params.dataDefinition.length == 0) return result;
    let rows = this.parse(text);
    if (!rows instanceof Array) rows = [rows];
    rows.forEach((row) => this.validateRow(row) && result.row.push(row));
    return result;
  }
  parse(text) {
    let rows = [];
    const bkp = JSON.parse(JSON.stringify(this.params.dataDefinition));
    text
      .split(this.params.subSeparator)
      .filter((line) => line !== "")
      .forEach((line, index) => {
        const row = super.parse(line);
        if (index == 0) {
          this.params.dataDefinition.tables.forEach((table) => {
            table.fields.forEach((field) => {
              if (row[table.tableName][field.fieldName] !== undefined)
                field.fixedValue = row[table.tableName][field.fieldName];
              return field;
            });
          });
        } else {
          rows.push(row);
        }
      });
    this.params.dataDefinition = bkp;
    return rows;
  }
}

module.exports = {
  ConverterParams,
  Converter,
  LabeledConverter,
  DelimitedConverter,
  HeaderRowsDelimitedConverter,
};

function test() {
  const util = require("util");
  function converterParamsTest(id, dataDefinition, separator = /,/) {
    const c = [];
    c.push(new ConverterParams());
    c.push(new ConverterParams(dataDefinition));
    c.push(new ConverterParams(dataDefinition, separator));
    c.push(
      new ConverterParams({
        dataDefinition: dataDefinition,
        separator: separator,
      })
    );
    if (id) {
      return c[id];
    } else {
      console.log("ConverterParams class test");
      console.log(util.inspect(c, false, null, true));
    }
  }
  function converterTest(text, className, params = converterParamsTest(2)) {
    const c = [];
    c.push(new className());
    c.push(new className(params));
    c.push(
      new className({ dataDefinition: params.dataDefinition, separator: /,/ })
    );
    console.log("Converter class test");
    console.log(util.inspect(c, false, null, true));
    console.log("Converter class test results");
    c.forEach((conv) =>
      console.log(util.inspect(conv.convert(text), false, null, true))
    );
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

  //converterParamsTest(null, labeledDef);
  //converterTest(testText, Converter);
  //converterTest(testText, LabeledConverter, labeledParams);
  //converterTest(testText, DelimitedConverter, delimitedParams);
}

//test();
