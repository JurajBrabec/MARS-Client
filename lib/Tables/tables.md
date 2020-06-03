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
Instantiate the class with `Table.create({options})`, select a table with `Table.use(table)`, manipulate row data with `Table.assign(values)` or `Table.match(string)`, retrieve `batch` object with `Table.batch(rows)`.

```
Table.create( {table1:[ id:"number", name:"string" ] } );
const fields = Table.fields( )
//  { id : number, name: string }
const row = Table.row( )
//  { id : undefined, name : undefined }
const row = Table.assign( [ 1, "John" ] );
//  { id : 1, name: "John" }
const batch = Table.batch( [ {id:1,name:"John"}, {id:2,name:"Peter"} ] )
//  { sql : "insert into table1 (id,name) values(:id,:name);",
      rows : [ {id:1,name:"John"},{id:2,name:"Peter"} ]
    }
const table = Table.get( );
Table.set(table).fields( );
```

#### Options

Object with following properties:

- `name` - name of the table
- `fields` - array of `Field` definitions.

#### Helpers

Following helper functions are available:

- `Table.create({options})` -
- `Table.get()` -
- `Table.use(table)` -
- `Table.fields()` -
- `Table.row()` -
- `Table.assign(values)` -
- `Table.match(string)` -
- `Table.batch(rows)` -

## Tables

Array of `Table` objects with same helpers.

#### Usage

`const Tables=require("./Tables.js")`
Initialize the array with `Table.create({options})`, manipulate row data with `Table.assign(values)` or `Table.match(string)`, retrieve `batch` object with `Table.batch(rows)`.

```
Tables.create( {table1:[ id:"number", name:"string" ] } );
const fields = Table.fields( )
//  { id : number, name: string }
const row = Tables.row( )
//  { id : undefined, name : undefined }
const row = Tables.assign( [ 1, "John" ] );
//  { id : 1, name: "John" }
const batch = Tables.batch( [ {id:1,name:"John"}, {id:2,name:"Peter"} ] )
//  { sql : "insert into table1 (id,name) values(:id,:name);",
      rows : [ {id:1,name:"John"},{id:2,name:"Peter"} ]
    }
const tables = Tables.get( );
Tables.use(table).fields( );
```

#### Options

Array of `Table` definition objects.

#### Helpers

Following helper functions are available:

- `Tables.create({options})` -
- `Tables.get()` -
- `Tables.use(tables)` -
- `Tables.fields()` -
- `Tables.row()` -
- `Tables.assign(values)` -
- `Tables.match(string)` -
- `Tables.batch(rows)` -
