const Field = require("./Field");

function create(props) {
  const name = Object.keys(props).find((key) => key);
  if (!name) throw new Error("Table name not provided.");
  const fields = props[name];
  if (!Array.isArray(fields)) fields = [fields];
  return new Table({ name, fields });
}
function fields(table) {
  return table.fields.reduce((row, field) => [...row, Field.create(field)], []);
}
function row(table) {
  return fields(table).reduce(
    (row, field) => ({ ...row, ...Field.get(field) }),
    {}
  );
}
function assign(table, array) {
  return fields(table).reduce(
    (row, field) => ({
      ...row,
      ...Field.get(
        field,
        field.value === undefined ? array.shift() : undefined
      ),
    }),
    {}
  );
}
function match(table, text = "") {
  return fields(table).reduce(
    (row, field) => ({
      ...row,
      ...Field.get(field, field.regExp ? text : undefined),
    }),
    {}
  );
}
function batch(table, rows) {
  const sql = sqlInsert(table);
  const result = { sql, rows: [] };
  const batchRows = Array.isArray(rows) ? [...rows] : [rows];
  batchRows.map((row) => result.rows.push(row));
  return result;
}
function sqlInsert(table) {
  const sqlFields = fields(table).filter((field) => !field.ignore);
  let sql = `INSERT INTO ${table.name} (`;
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

class Table {
  constructor({ name, fields }) {
    Object.assign(this, { name, fields });
  }
}

module.exports = {
  Table,
  create,
  fields,
  row,
  assign,
  match,
  batch,
};
