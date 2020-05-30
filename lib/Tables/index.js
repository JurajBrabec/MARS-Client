const { Table } = require("./Table");

class Tables {
  constructor(tables) {
    this.tables = [];
    if (!Array.isArray(tables)) tables = [tables];
    tables.map((table) => this.tables.push(new Table(table)));
  }
  batch = (rows) => {
    const result = this.tables.reduce((row, table) => {
      row[table.name] = { sql: table.sql(), rows: [] };
      return row;
    }, {});
    rows.map((row) =>
      Object.keys(row).map((table) => result[table].rows.push(row[table]))
    );
    return result;
  };
  fields = () =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.fields();
      return row;
    }, []);
  row = () =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.row();
      return row;
    }, {});
  assign = (array) => {
    let rowValues = [...array];
    return this.tables.reduce((row, table) => {
      row[table.name] = table.assign(rowValues);
      return row;
    }, {});
  };
  match = (text) =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.match(text);
      return row;
    }, {});
}

module.exports = { Tables };
