const Table = require("./Table");

let = _tables = null;

function create(props) {
  _tables = [];
  if (!Array.isArray(props)) props = [props];
  props.map((table) => _tables.push(Table.create(table)));
  return _tables;
}
function assign(array) {
  check();
  let rowValues = [...array];
  return _tables.reduce((row, table) => {
    row[table.name] = Table.use(table).assign(rowValues);
    return row;
  }, {});
}
function batch(rows) {
  check();
  if (rows === undefined) return;
  if (!Array.isArray(rows)) rows = [rows];
  const result = _tables.reduce((row, table) => {
    row[table.name] = Table.use(table).batch([]);
    return row;
  }, {});
  rows.map((row) =>
    Object.keys(row).map((table) => result[table].rows.push(row[table]))
  );
  return result;
}
function check() {
  if (!_tables) throw new Error("Tables are not created yet.");
}
function fields() {
  check();
  return _tables.reduce((row, table) => {
    row[table.name] = Table.use(table).fields();
    return row;
  }, []);
}
function get() {
  return _tables;
}
function match(text) {
  check();
  return _tables.reduce((row, table) => {
    row[table.name] = Table.use(table).match(text);
    return row;
  }, {});
}
function row() {
  check();
  return _tables.reduce((row, table) => {
    row[table.name] = Table.use(table).row();
    return row;
  }, {});
}
function use(tables) {
  if (tables) _tables = tables;
  return this;
}
module.exports = { create, get, use, fields, row, assign, match, batch };
