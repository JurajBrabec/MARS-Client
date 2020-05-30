const Field = require("./Field");

class Table {
  constructor(props) {
    const name = Object.keys(props).find((key) => key);
    if (!name) throw new Error("Table name not provided.");
    const definition = props[name];
    if (!Array.isArray(definition)) definition = [];
    Object.assign(this, { name, definition });
  }
  fields = () =>
    this.definition.reduce((row, field) => [...row, Field.create(field)], []);
  row = () =>
    this.fields().reduce((row, field) => ({ ...row, ...Field.set(field) }), {});
  assign = (array) =>
    this.fields().reduce(
      (row, field) => ({
        ...row,
        ...Field.set(
          field,
          field.regExp || field.value !== undefined
            ? field.value
            : array.shift()
        ),
      }),
      {}
    );
  match = (text) =>
    this.fields().reduce(
      (row, field) => ({
        ...row,
        ...Field.set(field, field.regExp ? text : field.value),
      }),
      {}
    );
  sql() {
    let sql = `INSERT INTO ${this.name} (`;
    const fields = this.fields().filter((field) => !field.ignore);
    sql += fields.map((field) => `\`${field.name}\``).join(",");
    sql += ") VALUES (";
    sql += fields.map((field) => `:${field.name}`).join(",");
    sql += ")";
    let updates = fields
      .filter((field) => field.update)
      .map((field) => `\`${field.name}\`=:${field.name}`)
      .join(",");
    if (updates) sql += " ON DUPLICATE KEY UPDATE " + updates;
    sql += ";";
    return sql;
  }
}

module.exports = { Table };
