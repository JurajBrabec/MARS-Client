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
  const assigned = _tables.reduce((row, table) => {
    const assigned = Table.use(table).assign([...array]);
    if (assigned) row[table.name] = assigned;
    return row;
  }, {});
  return Object.keys(assigned).length === 0 ? undefined : assigned;
}
function batch(rows) {
  check();
  const values = rows ? [] : undefined;
  const batched = _tables.reduce((row, table) => {
    row[table.name] = Table.use(table).batch(values);
    return row;
  }, {});
  if (rows) {
    if (!Array.isArray(rows)) rows = [rows];
    rows.map((row) =>
      Object.keys(row).map((table) => batched[table].rows.push(row[table]))
    );
  }
  return batched;
}
function buffer(set) {
  check();
  if (set === undefined) {
    return _tables.reduce((rows, table) => {
      const buffered = Table.use(table).buffer();
      if (buffered) rows[table.name] = buffered;
      return rows;
    }, {});
  } else {
    _tables.map((table) => Table.use(table).buffer(set));
    return this;
  }
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
function flush() {
  check();
  return _tables.reduce((rows, table) => {
    rows[table.name] = Table.use(table).flush();
    return rows;
  }, {});
}
function get() {
  return _tables;
}
function isBuffering() {
  check();
  return Table.use(_tables[0]).isBuffering();
}
function match(text) {
  check();
  const matched = _tables.reduce((row, table) => {
    const matched = Table.use(table).match(text);
    if (matched) row[table.name] = matched;
    return row;
  }, {});
  return Object.keys(matched).length === 0 ? undefined : matched;
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
module.exports = {
  create,
  get,
  use,
  fields,
  row,
  isBuffering,
  buffer,
  flush,
  assign,
  match,
  batch,
};
