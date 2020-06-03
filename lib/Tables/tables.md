# Tables

#### Field

#### Table

#### Tables

## Field

Basic class for handling table fields. Class methods should not be used direcly, but only from within the `Table`/`Tables` classes.

#### Usage

`const Field=require("./Field")`
Instantiate the class with `{options}` using helper `create(options)`, get result using `get(field, value)`.

```
const id = Field.create( { id: "number" } );
Field.get( id, 1 ); // { id : 1 }
```

#### Options

Object with `key:value` syntax, where `key` is the field name and `value` can be any of following:

- `type` definition, (`string`, `number`,`float` or `date`)
- regular expression (`/Name:(\w+)/`) field type is evaluated from the expression
- fixed value - any other value is considered as fixed value for that field, type is evaluated from the value
  Other possible properties:
- `key` _(optional)_ - in SQL builder, `key` fields are not in `ON DUPLICATE KEY UPDATE` section (default `false` - all fields will be updated)
- `ignore` _(optional)_ - in SQL builder, `ignore` fields are skipped (default `false` - all fields will be inserted)

```
Field.create( { id: "number", key : true } );
Field.create( { phone: /\d+/ } );
Field.create( { version: 4 } );
Field.create( { dummy: "string", ignore : true } )
```

#### Returns

Returns a `Field` object.

#### Helpers

Two helper functions are available, for creating and for updating of the value.

- `Field.create({options})`- see above
- `Field.get(field,value)` - sets a value for the field, doing type checking.  
  Returns an object in form `{name:value}` suitable for further use (row).

## Table

Basic class for handling table data. In general an array of `Fields` with few helpers.

#### Usage

`const Table=require("./Table.js")`
Instantiate the class with `Table.create({options})`, manipulate row data with `Table.assign(table,values)` or `Table.match(table,string)`, retrieve `batch` object with `Table.batch(sql,rows)`.

```
const table = Table.create( {table1:[ id:"number", name:"string" ] } );
const fields = Table.fields( table )
//  { id : number, name: string }
const row = Table.row( table )
//  { id : undefined, name : undefined }
const row = Table.assign( table, [ 1, "John" ] );
//  { id : 1, name: "John" }
const sql = Table.sqlInsert( table );
//  "insert into table1 (id,name) values(:id,:name);"
const batch = Table.batch( sql, [ {id:1,name:"John"}, {id:2,name:"Peter"} ] )
//  { sql : "insert into table1 (id,name) values(:id,:name);",
      rows : [ {id:1,name:"John"},{id:2,name:"Peter"} ]
    }
```

#### Options

Object with following properties:

- `name` - name of the table
- `fields` - array of `Field` definitions.

#### Helpers

Following helper functions are available:

- `Table.create({options})` -
- `Table.fields(table)` -
- `Table.row(table)` -
- `Table.assign(table,values)` -
- `Table.match(table,string)` -
- `Table.batch(table,rows)` -

## Tables

Array of `Table` objects with same helpers.

#### Usage

`const Tables=require("./Tables.js")`
Initialize the array with `Table.create({options})`, manipulate row data with `Table.assign(table,values)` or `Table.match(table,string)`, retrieve `batch` object with `Table.batch(table,rows)`.

```
const tables = Tables.create( {table1:[ id:"number", name:"string" ] } );
const fields = Table.fields( table )
//  { id : number, name: string }
const row = Tables.row( table )
//  { id : undefined, name : undefined }
const row = Tables.assign( table, [ 1, "John" ] );
//  { id : 1, name: "John" }
const batch = Tables.batch( table, [ {id:1,name:"John"}, {id:2,name:"Peter"} ] )
//  { sql : "insert into table1 (id,name) values(:id,:name);",
      rows : [ {id:1,name:"John"},{id:2,name:"Peter"} ]
    }

```

#### Options

Array of `Table` definition objects.

#### Helpers

Following helper functions are available:

- `Tables.create({options})` -
- `Tables.fields(tables)` -
- `Tables.row(tables)` -
- `Tables.assign(tables,values)` -
- `Tables.match(tables,string)` -
- `Tables.batch(tables,rows)` -
