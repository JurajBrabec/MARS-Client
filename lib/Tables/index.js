const { Table } = require("./Table");

class Tables {
  constructor(tables) {
    this.tables = [];
    if (!Array.isArray(tables)) tables = [tables];
    tables.map((table) => this.tables.push(new Table(table)));
  }
  assign = (array) => {
    let rowValues = [...array];
    return this.tables.reduce((row, table) => {
      row[table.name] = table.assign(rowValues);
      return row;
    }, {});
  };
  batchInsert = (rows) => {
    if (!Array.isArray(rows)) return rows;
    const result = this.tables.reduce((row, table) => {
      row[table.name] = table.batchInsert([]);
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
  match = (text) =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.match(text);
      return row;
    }, {});
  row = () =>
    this.tables.reduce((row, table) => {
      row[table.name] = table.row();
      return row;
    }, {});
}

module.exports = { Tables };
