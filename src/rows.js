class Rows {
  fields = [];
  rows = [];
  constructor(fields = []) {
    fields.forEach(field => this.addField(field));
    this.rows = [];
  }
  addField(name, type = "string", pattern, value) {
    let field = {};
    if (typeof name == "object") field = name;
    if (typeof name == "string") field = { name, type, pattern, value };
    this.fields.push(field);
    return this;
  }
  parseText() {
    let row = {};
    this.fields.forEach(field => {
      row[field.name] = field.value;
    });
    return row;
  }
  addRow(text) {
    let row = this.parseText(text);
    if (row !== null) {
      this.rows.push(row);
      this.onRow(row);
    }
    return this;
  }
  onRow(row) {
    //    if ((this.items.length = 1)) {
    //      console.log(this.asSQL());
    //      this.items = [];
    //    }
    return this;
  }
  asJSON() {
    return JSON.stringify(this.rows);
  }
  asSQL(tableName) {
    let insertSql = "INSERT INTO `" + tableName + "`\n";
    let updateSql = "ON DUPLICATE KEY UPDATE\n";
    insertSql += "(";
    this.fields.forEach((field, index) => {
      if (index > 0) insertSql += ",";
      insertSql += "`" + field.name + "`";
      if (index > 0) updateSql += ",";
      updateSql += "`" + field.name + "`=VALUES(`" + field.name + "`)";
    });
    insertSql += ")\nVALUES\n(";
    this.rows.forEach((row, index) => {
      if (index > 0) insertSql += "),\n(";
      this.fields.forEach((field, index) => {
        if (index > 0) insertSql += ",";
        if (field.type != "number") insertSql += "`";
        insertSql += row[field.name];
        if (field.type != "number") insertSql += "`";
      });
    });
    insertSql += ")\n" + updateSql;
    insertSql += ";";
    return insertSql;
  }
}

class LabeledRows extends Rows {
  parseText(text) {
    let row = super.parseText(text);
    this.fields.forEach(field => {
      let match =
        field.pattern instanceof RegExp ? field.pattern.exec(text) : false;
      if (match) row[field.name] = match[1];
    });
    return row;
  }
}

class DelimitedRows extends Rows {
  delimiter = ",";
  constructor(fields = {}, delimiter = ",") {
    super(fields);
    this.delimiter = delimiter;
  }
  parseText(text) {
    if (text == "") return null;
    let row = super.parseText(text);
    let match = text.split(this.delimiter);
    this.fields
      .filter(field => field.value === undefined)
      .forEach((field, index) => {
        if (index < match.length) row[field.name] = match[index];
      });
    return row;
  }
}

module.exports = { Rows, LabeledRows, DelimitedRows };
