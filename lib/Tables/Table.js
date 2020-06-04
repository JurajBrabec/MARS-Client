const Field = require("./Field");

let _table = null;
let _buffer = {};

function create(props) {
  const name = Object.keys(props).find((key) => key);
  if (!name) throw new Error("Table name not provided.");
  const fields = props[name];
  if (!Array.isArray(fields)) fields = [fields];
  _table = new Table({ name, fields });
  return _table;
}
function buffer(set) {
  check();
  if (set === undefined) return isBuffering() ? _buffer[_table.name] : false;
  if (set) {
    _buffer[_table.name] = [];
  } else {
    if (set === false) delete _buffer[_table.name];
  }
  return this;
}
function isBuffering() {
  check();
  return Array.isArray(_buffer[_table.name]);
}
function check() {
  if (!_table) throw new Error("Table is not created yet.");
}
function fields() {
  check();
  return _table.fields.reduce(
    (row, field) => [...row, Field.create(field)],
    []
  );
}
function flush() {
  check();
  let flushed = [];
  if (isBuffering()) {
    flushed = buffer();
    _buffer[_table.name] = [];
  }
  return flushed;
}
function get() {
  return _table;
}
function row() {
  check();
  return fields(_table).reduce(
    (row, field) => ({ ...row, ...Field.get(field) }),
    {}
  );
}
function assign(array = []) {
  check();
  const assigned = fields(_table).reduce(
    (row, field) => ({
      ...row,
      ...Field.get(
        field,
        field.value === undefined ? array.shift() : undefined
      ),
    }),
    {}
  );
  if (isBuffering()) {
    buffer().push(assigned);
    return;
  } else {
    return assigned;
  }
}
function match(text = "") {
  check();
  const matched = fields(_table).reduce(
    (row, field) => ({
      ...row,
      ...Field.get(field, field.regExp ? text : undefined),
    }),
    {}
  );
  if (isBuffering()) {
    buffer().push(matched);
    return;
  } else {
    return matched;
  }
}
function batch(rows) {
  check();
  if (rows === undefined && isBuffering()) rows = flush();
  const sql = sqlInsert(_table);
  const batched = { sql, rows: [] };
  const batchRows = Array.isArray(rows) ? [...rows] : [rows];
  batchRows.map((row) => batched.rows.push(row));
  return batched;
}
function sqlInsert() {
  check();
  const sqlFields = fields(_table).filter((field) => !field.ignore);
  let sql = `INSERT INTO ${_table.name} (`;
  sql += sqlFields.map((field) => `\`${field.name}\``).join(",");
  sql += ") VALUES (";
  sql += sqlFields.map((field) => `:${field.name}`).join(",");
  sql += ")";
  let updates = sqlFields
    .filter((field) => field.update)
    .map((field) => `\`${field.name}\`=:${field.name}`)
    .join(",");
  if (updates) sql += " ON DUPLICATE KEY UPDATE " + updates;
  sql += ";";
  return sql;
}
function use(table) {
  if (table) _table = table;
  return this;
}
class Table {
  constructor({ name, fields }) {
    Object.assign(this, { name, fields });
  }
}

module.exports = {
  Table,
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
