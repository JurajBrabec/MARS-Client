const Table = require("./Table");

function create(props) {
  const tables = [];
  if (!Array.isArray(props)) props = [props];
  props.map((table) => tables.push(Table.create(table)));
  return tables;
}
function assign(tables, array) {
  let rowValues = [...array];
  return tables.reduce((row, table) => {
    row[table.name] = Table.assign(table, rowValues);
    return row;
  }, {});
}
function batch(tables, rows) {
  if (rows === undefined) return;
  if (!Array.isArray(rows)) rows = [rows];
  const result = tables.reduce((row, table) => {
    row[table.name] = Table.batch(table, []);
    return row;
  }, {});
  rows.map((row) =>
    Object.keys(row).map((table) => result[table].rows.push(row[table]))
  );
  return result;
}
function fields(tables) {
  return tables.reduce((row, table) => {
    row[table.name] = Table.fields(table);
    return row;
  }, []);
}
function match(tables, text) {
  return tables.reduce((row, table) => {
    row[table.name] = Table.match(table, text);
    return row;
  }, {});
}
function row(tables) {
  return tables.reduce((row, table) => {
    row[table.name] = Table.row(table);
    return row;
  }, {});
}

module.exports = { create, fields, row, assign, match, batch };
