//TABLES
const Tables = require("./index");
console.log("TABLES");

const table1Def = {
  table1: [
    { id: "number" },
    { height: "float" },
    { name: "string" },
    { birth: "date" },
    { phone: /phone:(\d+)/ },
    { value: "fixed" },
  ],
};
const table2Def = {
  table2: [
    { id: "number" },
    { height: "float" },
    { name: "string" },
    { birth: "date" },
    { phone: /phone:(\d+)/ },
    { value: "fixed" },
  ],
};
const values = [
  1,
  5.6,
  "John",
  "2001-01-01",
  "phone:112",
  2,
  7.8,
  "Peter",
  "1990-12-31",
  "phone:158",
];
const tables = Tables.create([table1Def, table2Def]);

console.log("Tables:", tables);
console.log("Fields:", Tables.fields(tables));
console.log("Row:", Tables.row(tables));
console.log("Values:", values);
const row = Tables.assign(tables, [...values]);
console.log("Assign:", row);
console.log("Match:", Tables.match(tables, values.join()));
console.log("Batch:", Tables.batch(tables, row));
