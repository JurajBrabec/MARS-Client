const Field = require("./Field");

let _table = null;
let _buffer = {};
function create(props) {
  const name = Object.keys(props).find((key) => key);
  if (!name) throw new Error("Table name not provided.");
  const fields = props[name];
  if (!Array.isArray(fields)) fields = [fields];
  _table = new Table({ name, fields });
  _buffer[name] = { as: "object", size: 0, rows: [] };
  return this;
}
function _onFlush(rows) {
  let result;
  switch (_buffer[_table.name].as) {
    case "array":
      result = rows.map((row) => Object.values(row).map((value) => value));
      break;
    case "batch":
      result = batch(rows);
      break;
    case "object":
    default:
      result = rows;
  }
  return result;
}
function asArray() {
  check();
  _buffer[_table.name].as = "array";
  return this;
}
function asBatch(rows) {
  check();
  buffer(rows);
  _buffer[_table.name].as = "batch";
  return this;
}
function asObject() {
  check();
  _buffer[_table.name].as = "object";
  return this;
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
  return push(assigned);
}
function batch(rows) {
  check();
  if (rows === null) return rows;
  if (rows === undefined) {
    rows = _buffer[_table.name].rows;
    clear();
  }
  if (rows.length === 0) return null;
  const sql = sqlInsert(_table);
  const batched = { sql, rows: [] };
  const batchRows = Array.isArray(rows) ? [...rows] : [rows];
  batchRows.map((row) => batched.rows.push(row));
  return batched;
}
function buffer(size) {
  check();
  if (size === undefined) {
    return _onFlush(_buffer[_table.name].rows);
  } else {
    clear(size);
    return this;
  }
}
function check() {
  if (!_table) throw new Error("Table is not created yet.");
}
function clear(size) {
  check();
  if (size) {
    _buffer[_table.name] = { size, rows: [] };
    asObject();
  } else {
    _buffer[_table.name].rows = [];
  }
  return this;
}
function dirty() {
  check();
  return _buffer[_table.name].rows.length;
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
  const flushed = buffer();
  clear();
  return flushed;
}
function get() {
  return _table;
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
  return push(matched);
}
function push(row) {
  check();
  _buffer[_table.name].rows.push(row);
  const size = _buffer[_table.name].size || 1;
  if (size > dirty()) return null;
  return _onFlush(_buffer[_table.name].rows.splice(0, size));
}
function row() {
  check();
  return fields(_table).reduce(
    (row, field) => ({ ...row, ...Field.get(field) }),
    {}
  );
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
  asArray,
  asBatch,
  asObject,
  assign,
  batch,
  buffer,
  clear,
  create,
  dirty,
  fields,
  flush,
  get,
  match,
  row,
  use,
};
