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

> `const Table=require("./Table.js")`

Instantiate the class with `Table.create({options})`  
Define output format with `Table.asObject()`, `Table.asArray()` or `Table.asBatch()`  
Manipulate row data with `Table.assign(values)` or `Table.match(string)`

```
Table.create( {table1:[ id:"number", name:"string" ] } );
const fields = Table.fields( )
//  { id : number, name: string }
const row = Table.row( )
//  { id : undefined, name : undefined }
const row = Table.assign( [ 1, "John" ] );
//  { id : 1, name: "John" }
```

##### if you use buffering:

Buffer rows with `Table.buffer([limit])`  
Clear the buffer with `Table.clear()`  
Check number of buffered rows with `Table.dirty()`  
Retrieve buffer with `Table.buffer()` or `Table.flush()`  
(flush is the same as buffer+clear)

```
Table.buffer( 10 ).asBatch( );
Table.assign( [ 1, "John" ] );
// null
Table.assign( [ 2, "Peter" ] );
// null
Table.dirty( );
// 2
const batch = Table.flush( )
//  { sql : "insert into table1 (id,name) values(:id,:name);",
      rows : [ {id:1,name:"John"},{id:2,name:"Peter"} ]
    }
```

##### if you use more tables:

Get current table reference with `Table.get()`  
Select a previous table with `Table.use(table)`

```
const table = Table.get( );
Table.use(table);
```

#### Options

Object with following properties:

- `name` - name of the table
- `fields` - array of `Field` definitions.

#### Helpers

Following helper functions are available:

- `Table.create({options})` -
- `Table.asArray()` -
- `Table.asbatch()` -
- `Table.asObjects()` -
- `Table.get()` -
- `Table.use(table)` -
- `Table.fields()` -
- `Table.row()` -
- `Table.buffer([limit])` -
- `Table.buffer()` -
- `Table.dirty()` -
- `Table.flush()` -
- `Table.assign(values)` -
- `Table.match(string)` -
- `Table.batch([rows])` -

## Tables

Array of `Table` objects with same helpers.

#### Usage

> `const Tables=require("./Tables.js")`

Instantiate the class with `Tables.create({options})`  
Define output format with `Tables.asObject()`, `Tables.asArray()` or `Tables.asBatch()`  
Manipulate row data with `Tables.assign(values)` or `Tables.match(string)`

```
Tables.create( {table1:[ id:"number", name:"string" ] }, {table2:[ id:"number", role:"string" ] } );
const fields = Tables.fields( )
// [ table1 : { id : "number", name: "string" }, table2: { id:"number", role: "string" } ]
const row = Tables.row( )
// [ table1 :] { id : undefined, name : undefined }, table2 : { id: "number", role: "string" } ]
const row = Tables.assign( [ 1, "John", 1, "worker" ] );
// [ table1: { id : 1, name: "John" }, table2: { id : 1, role : "worker"  } ]
```

##### if you use buffering:

Buffer rows with `Tables.buffer([limit])`  
Clear the buffer with `Tables.clear()`  
Check number of buffered rows with `Tables.dirty()`  
Retrieve buffer with `Tables.buffer()` or `Tables.flush()`  
(flush is the same as buffer+clear)

```
Tables.buffer( 10 ).asBatch( );
Tables.assign( [ 1, "John", 1, "worker" ] );
// null
Tables.assign( [ 2, "Peter", 2, "director" ] );
// null
Tables.dirty( );
// 4
const batch = Tables.flush( )
// [ table 1: { sql : "insert into table1 (id,name) values(:id,:name);",
      rows : [ {id:1,name:"John"},{id:2,name:"Peter"} ]
    },
    table 2: { sql : "insert into table2 (id,role) values(:id,:role);",
      rows : [ {id:1,role:"worker"},{id:2,role:"director"} ]
    }
```

#### Options

Array of `Table` definition objects.

#### Helpers

Following helper functions are available:

- `Tables.create({options})` -
- `Tables.asArray()` -
- `Tables.asbatch()` -
- `Tables.asObjects()` -
- `Tables.use(tables)` -
- `Tables.fields()` -
- `Tables.row()` -
- `Tables.buffer([limit])` -
- `Tables.buffer()` -
- `Tables.dirty()` -
- `Tables.flush()` -
- `Tables.assign(values)` -
- `Tables.match(string)` -
- `Tables.batch([rows])` -
