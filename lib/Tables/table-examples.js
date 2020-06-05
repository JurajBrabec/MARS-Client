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
Table.create(tableDef);
console.log("Table:", Table.get());
console.log("Field definition:", Table.get().fields);
console.log("Fields:", Table.fields());
console.log("Row:", Table.row());
console.log("Values:", values);
const row = Table.asArray().assign([...values]);
console.log("Assign:", row);
console.log(Table.assign([...values]));
console.log("Match:", Table.match(values.join()));
console.log("Batch:", Table.batch(row));
Table.buffer(4).asBatch();
console.log("Assign1:", Table.assign([...values]));
console.log("Assign2:", Table.assign([...values]));
console.log("Assign3:", Table.assign([...values]));
console.log("Buffer:", Table.asArray().buffer());
console.log("Dirty:", Table.dirty());
if (Table.dirty()) console.log("Flush:", Table.asBatch().flush());
