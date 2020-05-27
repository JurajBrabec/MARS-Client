const { Table } = require("./Table");

class Tables {
  constructor(tables) {
    this.tables = [];
    if (!Array.isArray(tables)) tables = [tables];
    tables.map((table) => this.tables.push(new Table(table)));
  }
  fields = () =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.fields();
      return row;
    }, []);
  row = () =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.row();
      return row;
    }, []);
  assign = (array) =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.assign(array);
      return row;
    }, []);
  match = (text) =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.match(text);
      return row;
    }, []);
}

module.exports = { Tables };
