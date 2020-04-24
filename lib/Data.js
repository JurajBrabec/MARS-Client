class Field {
  constructor(field) {
    if (typeof field !== "object")
      throw new Error(`field definition "${field}" not an object.`);
    this.name = undefined;
    this.type = undefined;
    this.regExp = undefined;
    this.value = undefined;
    for (const [key, value] of Object.entries(field)) {
      if (!this.name) {
        this.name = key;
        if (["string", "number", "float", "date"].includes(value)) {
          this.type = value;
        } else {
          if (value instanceof RegExp) {
            this.type = "string";
            const string = value.source;
            if (/\(\\d\+\)/.test(string)) this.type = "number";
            if (/\(\\d\+\.\\d\+\)/.test(string)) this.type = "float";
            if (/\\d\+[\:|\-|\/]\\d\+/.test(string)) this.type = "date";
            this.regExp = value;
          } else {
            if (this.isNumber(value)) this.type = "number";
            if (this.isFloat(value)) this.type = "float";
            if (this.isString(value)) this.type = "string";
            if (this.isDate(value)) this.type = "date";
            this.value = value;
          }
        }
        this.update = true;
        this.ignore = false;
        continue;
      }
      switch (key) {
        case "ignore":
          this.ignore = true;
          break;
        case "key":
          this.update = false;
          break;
        default:
          this[key] = value;
          break;
      }
    }
    if (!this.name) throw new Error(`wrong field definition "${field}".`);
  }
  isNumber = (value) => this.isFloat(value) && value % 1 === 0;
  isFloat = (value) => Number(value) === value;
  isDate = (value) => !isNaN(Date.parse(value));
  isString = (value) => typeof value === "string";

  set(value) {
    if (this.regExp) {
      let match = value.match(this.regExp);
      if (match) {
        this.regExp.global || match.shift();
        value = match.join("\n").trim();
      } else {
        value = null;
      }
    }
    value = this.validate(value);
    //    this.value = value;
    return value;
  }
  validate(value) {
    if (value === "" || value === "null") value = null;
    if (value === undefined || value === null) return value;
    let result = false;
    const err = `field "${this.name}" value "${value}"`;
    switch (this.type) {
      case "number":
        result = Number(value);
        if (!this.isNumber(result)) throw new Error(`${err} not a number.`);
        break;
      case "float":
        result = Number(value);
        if (!this.isFloat(result)) throw new Error(`${err} not a float.`);
        break;
      case "string":
        result = String(value);
        if (!this.isString(result)) throw new Error(`${err} not a string.`);
        break;
      case "date":
        result = new Date(value);
        if (!this.isDate(result)) throw new Error(`${err} not a date.`);
        break;
    }
    return result;
  }
}
class Table {
  constructor(table, fields = []) {
    if (typeof table === "object") {
      this.name = table.name;
      this.fieldDefinition = table.fields || fields;
    } else {
      this.name = table;
      this.fieldDefinition = fields;
    }
    this.fields = [];
    try {
      this.fieldDefinition.forEach((definition) => {
        this.fields.push(new Field(definition));
      });
    } catch (err) {
      if (
        err instanceof SyntaxError ||
        err instanceof ReferenceError ||
        err instanceof TypeError
      )
        throw err;
      throw new Error(`Table "${this.name}": ${err.message}`);
    }
    if (this.fields.length == 0)
      throw new Error(`Wrong table "${table}" definition.`);
  }
  row() {
    let result = {};
    let fields = {};
    this.fields.forEach((field) => (fields[field.name] = field.value));
    result[this.name] = fields;
    return result;
  }
  field(name) {
    return this.fields.find((field) => field.name === name);
  }
  set(row, fieldName, value) {
    let result = false;
    try {
      result = this.field(fieldName).set(value);
      row[this.name][fieldName] = result;
    } catch (err) {
      if (
        err instanceof SyntaxError ||
        err instanceof ReferenceError ||
        err instanceof TypeError
      )
        throw err;
      throw new Error(`Table "${this.name}": ${err.message}`);
    }
    return result;
  }
  assign(row, array = [], start = 0) {
    let index = start;
    this.fields
      .filter((field, index) => !field.value && !field.regExp)
      .forEach((field) => {
        if (index < array.length)
          this.set(row, field.name, array[index].trim());
        index++;
      });
    return index;
  }
  match(row, text) {
    this.fields
      .filter((field) => field.regExp)
      .forEach((field) => this.set(row, field.name, text));
  }
}

class Tables {
  constructor(tables = []) {
    this.tables = [];
    if (!(tables instanceof Array)) tables = [tables];
    tables.forEach((table) =>
      this.tables.push(table instanceof Table ? table : new Table(table))
    );
    if (this.tables.length == 0)
      throw new Error(`Wrong tables definition ${tables}.`);
  }
  table(name) {
    return this.tables.find((table) => table.name === name);
  }
  row() {
    let result = {};
    this.tables.forEach((table) => (result = { ...result, ...table.row() }));
    return result;
  }
  field(tableName, fieldName) {
    return this.table(tableName).field(fieldName);
  }
  set(row, tableName, fieldName, value) {
    this.table(tableName).set(row, fieldName, value);
  }
  assign(row, array, start = 0) {
    this.tables.forEach((table) => (start = table.assign(row, array, start)));
  }
  match(row, text) {
    this.tables.forEach((table) => table.match(row, text));
  }
}

module.exports = { Tables };

function test() {
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

  try {
    const table1 = new Table("tableName1", fields);
    const table2 = new Table({ name: "tableName2", fields });
    const tables = new Tables([table1, table2]);
    const row = tables.row();
    tables.assign(row, [1, 2, 3, 4, 5]);
    tables.match(row, "bla:1");
    console.log(row);
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
