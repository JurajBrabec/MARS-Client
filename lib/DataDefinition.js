// new FieldDefinition({fieldName:"f1",fieldType="string",regExp:/\w+/,fixedValue:"v",updateOnInsert:true})
// new FieldDefinition("f1","string",/\w+/,"v",true})
class FieldDefinition {
  constructor(
    field,
    fieldType = "string",
    regExp,
    fixedValue,
    updateOnInsert = false
  ) {
    if (typeof field == "object") {
      this.fieldName = field.fieldName;
      this.fieldType = field.fieldType || fieldType;
      this.regExp = field.regExp || regExp;
      this.fixedValue = field.fixedValue;
      this.updateOnInsert = field.updateOnInsert;
    } else {
      this.fieldName = field || "f1";
      this.fieldType = fieldType;
      this.regExp = regExp;
      this.fixedValue = fixedValue;
      this.updateOnInsert = updateOnInsert;
    }
  }
}
//new TableDefinition("table",[{fieldName:"f"},{fieldName:"f"}])
//new TableDefinition("table").addField({fieldName:"f"})
//new TableDefinition("table").addField(new FieldDefinition("f"))
class TableDefinition {
  constructor(tableName = "t1", fields = []) {
    this.tableName = tableName;
    this.fields = [];
    if (fields) fields.forEach((field) => this.addField(field));
  }
  addField(field, fieldType, regExp, fixedValue) {
    if (field instanceof FieldDefinition) {
      this.fields.push(field);
    } else {
      this.fields.push(
        new FieldDefinition(field, fieldType, regExp, fixedValue)
      );
    }
    return this;
  }
}
//new DataDefinition(tableDefinition)
//new DataDefinition(tabledefinition1).addTable(tableDefinition2)
//new DataDefinition([tableDefinition,tableDefinition2])
class DataDefinition {
  constructor(table, fields) {
    this.tables = [];
    if (table instanceof Array) {
      table.forEach((table) => this.addTable(table));
    } else {
      this.addTable(table, fields);
    }
  }
  addTable(table, fields) {
    if (!table) return this;
    if (table instanceof TableDefinition) {
      this.tables.push(table);
    } else if (table instanceof Object) {
      this.tables.push(new TableDefinition(table.tableName, table.fields));
    } else {
      this.tables.push(new TableDefinition(table, fields));
    }
    return this;
  }
}

module.exports = { TableDefinition, DataDefinition };

function test() {
  const util = require("util");
  function fieldDefinitionTest(
    id,
    fieldName = "f1",
    fieldType = "string",
    regExp = "/w+/",
    fixedValue,
    updateOnInsert
  ) {
    const f = [];
    f.push(new FieldDefinition());
    f.push(new FieldDefinition(fieldName));
    f.push(new FieldDefinition(fieldName, fieldType));
    f.push(new FieldDefinition(fieldName, fieldType, regExp));
    f.push(new FieldDefinition(fieldName, fieldType, regExp, fixedValue));
    f.push(
      new FieldDefinition(
        fieldName,
        fieldType,
        regExp,
        fixedValue,
        updateOnInsert
      )
    );
    f.push(
      new FieldDefinition({
        fieldName: fieldName,
        fieldType: fieldType,
        regExp: regExp,
        fixedValue: fixedValue,
        updateOnInsert: updateOnInsert,
      })
    );
    if (id) {
      return f[id];
    } else {
      console.log("FieldDefinition class test");
      console.log(util.inspect(f, false, null, true));
    }
  }
  function tableDefinitionTest(id, tableName = "t1") {
    const t = [];
    const f = {
      fieldName: "f1",
      fieldType: "string",
      regExp: /\w+/,
      fixedValue: "v",
      updateOnInsert: true,
    };
    t.push(new TableDefinition());
    t.push(new TableDefinition(tableName));
    t.push(new TableDefinition(tableName, [fieldDefinitionTest(1), f]));
    t.push(new TableDefinition(tableName).addField(fieldDefinitionTest(1)));
    t.push(new TableDefinition(tableName).addField(f));
    t.push(
      new TableDefinition(tableName).addField("f1", "string", /\w+/, "v", true)
    );
    if (id) {
      return t[id];
    } else {
      console.log("TableDefinition class test");
      console.log(util.inspect(t, false, null, true));
    }
  }
  function dataDefinitionTest(id, tableDefinition = tableDefinitionTest(2)) {
    const d = [];
    d.push(new DataDefinition());
    d.push(new DataDefinition(tableDefinition));
    d.push(new DataDefinition([tableDefinition, tableDefinitionTest(3)]));
    d.push(new DataDefinition().addTable(tableDefinition));
    d.push(
      new DataDefinition(tableDefinition).addTable(tableDefinitionTest(3))
    );
    d.push(
      new DataDefinition([tableDefinition, tableDefinitionTest(3)]).addTable(
        tableDefinitionTest(4)
      )
    );
    if (id) {
      return d[id];
    } else {
      console.log("DataDefinition class test");
      console.log(util.inspect(d, false, null, true));
    }
  }

  //fieldDefinitionTest();
  //tableDefinitionTest();
  //dataDefinitionTest();
}
