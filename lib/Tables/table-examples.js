// TABLE
const Table = require("./Table");
console.log("TABLE");

const tableDef = {
  table1: [
    { id: "number" },
    { height: "float" },
    { name: "string" },
    { birth: "date" },
    { phone: /phone:(\d+)/ },
    { value: "fixed" },
  ],
};
const values = [1, 5.6, "John", "2001-01-01", "phone:112", "value"];
const table = Table.create(tableDef);

console.log("Table:", table);
console.log("Field definition:", table.fields);
console.log("Fields:", Table.fields(table));
console.log("Row:", Table.row(table));
console.log("Values:", values);
const row = Table.assign(table, [...values]);
console.log("Assign:", row);
console.log("Match:", Table.match(table, values.join()));
console.log("Batch:", Table.batch(table, row));
