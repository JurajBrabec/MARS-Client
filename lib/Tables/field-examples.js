// FIELD
const Field = require("./Field");
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
  const f = def.name ? new Field.Field(def) : Field.create(def);
  console.log("\n");
  console.log(title);
  console.log("Definition:", def);
  console.log("Instance:", f);
  console.log("Get():", Field.get(f));
  values.map((value) => {
    try {
      console.log(`Get(${value}):`, Field.get(f, value));
    } catch (e) {
      console.log(`Error in Get(${value}):`, e.message);
    }
  });
}
//USAGE
console.log("USAGE:");
testField("CLASS:", classDef, []);
testField("HELPER:", helperDef, []);
//TYPES
console.log("TYPES:");
testField("STRING:", classStringDef, testValues);
testField("NUMBER:", classNumberDef, testValues);
testField("FLOAT:", classFloatDef, testValues);
testField("DATE:", classDateDef, testValues.concat(["2020-06-01"]));
testField("REGEXP:", classRegExpDef, ["name:John"].concat(testValues));
testField("FIXED:", classFixedDef, testValues);

console.log("HELPER:");
testField("STRING:", helperStringDef, testValues);
testField("NUMBER:", helperNumberDef, testValues);
testField("FLOAT:", helperFloatDef, testValues);
testField("DATE:", helperDateDef, testValues.concat(["2020-06-01"]));
testField("REGEXP:", helperRegExpDef, ["name:John"].concat(testValues));
testField("FIXED:", helperFixedDef, testValues);
