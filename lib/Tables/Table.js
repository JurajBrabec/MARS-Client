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
}

module.exports = { Table };
