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
console.log("Fields:", Table.fields());
console.log("Row:", Table.row());
console.log("Values:", values);
const row = Table.assign([...values]);
console.log("Assign:", row);
console.log("Match:", Table.match(values.join()));
console.log("Batch:", Table.batch(row));

const r1 = Table.use(table).row();
console.log(r1);
