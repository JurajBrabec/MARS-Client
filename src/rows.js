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
    if (typeof name == "string")
      field = {
        name: name,
        type: type,
        pattern: pattern,
        value: value
      };
    this.fields.push(field);
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
    if (row !== {}) {
      this.rows.push(row);
      this.onRow();
    }
    return this;
  }
  onRow() {
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
      let match = field.pattern.exec(text);
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

headers = [
  {
    name: "id",
    type: "number",
    value: 1
  },
  {
    name: "masterServer",
    type: "string",
    pattern: /Master Server: (\S+)/u
  },
  {
    name: "dataServer",
    type: "string",
    pattern: /Data Server: (\S+)/u
  },
  {
    name: "created",
    type: "datetime",
    value: "2020-03-14 15:30"
  }
];
//text = "Master Server: testServer\nData Server: anotherServer";
text = "aaa,bbb";

rows = new DelimitedRows([], ",");
rows.addField("id", "number", "", 1);
rows.addField("masterServer", "string", /Master Server: (\S+)/u);
rows.addField("dataServer", "string", /Data Server: (\S+)/u);
rows.addField("created", "datetime", "", "2020-03-14 15:30");
//console.log(rows.parseText(text));
rows.addRow(text);
rows.addRow(text);
console.log(rows.asJSON());

const mariadb = require("mariadb");

mariadb
  .createConnection({
    host: "192.168.1.10",
    port: 32771,
    user: "root",
    password: "r00t123"
  })
  .then(conn => {
    conn
      .query("select now();", [2])
      .then(rows => {
        console.log(rows); // [{ "1": 1 }]
        conn.end();
      })
      .catch(err => {
        console.log(err);
      });
  })
  .catch(err => {
    console.log(err);
  });
