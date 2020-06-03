// FIELD
const field = require("./Field");
console.log("FIELD");

const classDef = { name: "id", type: "number" };
const helperDef = { id: "number" };
const classStringDef = { name: "id", type: "string" };
const classNumberDef = { name: "id", type: "number" };
const classFloatDef = { name: "id", type: "float" };
const classDateDef = { name: "id", type: "date" };
const classRegExpDef = { name: "id", type: "string", regExp: /name:(\w+)/ };
const classFixedDef = { name: "id", value: "fixed" };
const helperStringDef = { id: "string" };
const helperNumberDef = { id: "number" };
const helperFloatDef = { id: "float" };
const helperDateDef = { id: "date" };
const helperRegExpDef = { id: /name:(\w+)/ };
const helperFixedDef = { id: "fixed" };
const testValues = ["John", 1, 1.1, new Date(), null, undefined];

function testField(title, def, values) {
  const f = def.name ? new field.Field(def) : field.create(def);
  console.log("\n");
  console.log(title);
  console.log("Definition:", def);
  console.log("Instance:", f);
  console.log("Set():", field.set(f));
  values.map((value) => {
    try {
      console.log(`Set(${value}):`, field.set(f, value));
    } catch (e) {
      console.log(`Error in Set(${value}):`, e.message);
    }
  });
}
//USAGE
console.log("USAGE:");
testField("CLASS:", classDef, []);
testField("HELPER:", helperDef, []);
//TYPES
console.log("TYPES (AND SET):");
testField("STRING:", classStringDef, testValues);
testField("NUMBER:", classNumberDef, testValues);
testField("FLOAT:", classFloatDef, testValues);
testField("DATE:", classDateDef, testValues.concat(["2020-06-01"]));
testField("REGEXP:", classRegExpDef, ["name:John"].concat(testValues));
testField("FIXED:", classFixedDef, testValues);

console.log("HELPER (AND SET):");
testField("STRING:", helperStringDef, testValues);
testField("NUMBER:", helperNumberDef, testValues);
testField("FLOAT:", helperFloatDef, testValues);
testField("DATE:", helperDateDef, testValues.concat(["2020-06-01"]));
testField("REGEXP:", helperRegExpDef, ["name:John"].concat(testValues));
testField("FIXED:", helperFixedDef, testValues);
