# Tables

#### Field

#### Table

#### Tables

## Field

Basic class for handling table fields. Class methods should not be used direcly, but from within the `Table`/`Tables` classes.

#### Usage

Instantiate the class with expanded `{options}` or use shorthanded `{options}` using helper `create(options)`, set value using `set(field, value)` and use the result` .

```
const id = new Field( { name: "id", type: "number" } );
const id = create( { id: "number" } );
set( id, 1 ); //{ id : 1 }
```

#### Options (using `new Field()`)

Object with following properties:

- `name` - field name is mandatory
- `type` _(optional)_ - field type can be `string` (default), `number`,`float` or `date`
- `regExp` _(optional)_ - field can be defined by providing a `regExp` pattern (see `Table.match()`)
- `value` _(optional)_ - field can have a fixed value, it is skipped during `Table.assign()` or `Table.match()`
- `key` _(optional)_ - in SQL builder, `key` fields are not in `ON DUPLICATE KEY UPDATE` section (default `false` - all fields will be updated)
- `ignore` _(optional)_ - in SQL builder, `ignore` fields are skipped (default `false` - all fields will be inserted)

```
new Field( { name:"id", type:"number", key : true } );
new Field( { name:"phone" regExp: /\d+/ } );
new Field( { name:"version" type:"number", value: 4 } );
new Field( { name:"dummy", type:"string", ignore : true } )
```

#### Shorthanded options (using `create()`)

Object with `key:value` syntax, where `key` is the field name and `value` can be any of following:

- `type` definition, (`string`, `number`,`float` or `date`)
- regular expression (`/Name:(\w+)/`) field type is evaluated from the expression
- fixed value - any other value is considered as fixed value for that field, type is evaluated from the value

```
create( { id: "number", key : true } );
create( { phone: /\d+/ } );
create( { version: 4 } );
create( { dummy: "string", ignore : true } )
```

#### Returns

Returns a `Field` object.

#### Helpers

Two helper functions are available, for creating and for updating of the value.

- `create({options})`- see above
- `set(field,value)` - sets a new value for the field, doing type checking.  
  Returns an object in form `{name:value}` suitable for further use (row).

## Table

Basic class for handling table data. In general an array of `Fields` with few methods.

#### Usage

Instantiate the class with `{options}`, manipulate row data with `.assign(values)` or `.match(string)`, retreive `batch` object with `.batchInsert(rows)`.

```
const table = new Table( {name:"table1", fields:[ id:"number", name:"string" ] } );
const fields = table.fields( )
//  { id : number, name: string }
const row = table.row( )
//  { id : undefined, name : undefined }
const row = table.assign( [ 1, "John" ] );
//  { id : 1, name: "John" }
const batch = table.batchInsert( [ {id:1,name:"John"}, {id:2,name:"Peter"} ] )
//  { sql : "insert into table1 (id,name) values(:id,:name);",
      rows : [ {id:1,name:"John"},{id:2,name:"Peter"} ]
    }
```

#### Options

Object with following properties:

- `name` - name of the table
- `fields` - array of `Field` definitions.

#### Methods

Following methods are available:

- `.fields()` -
- `.row()` -
- `.assign(values)` -
- `.match(string)` -
- `.batchInsert(rows)` -
- `.sqlInsert()` -

## Tables

Basic class for handling multiple tables of data. In general an array of `Table` objects with same methods.

#### Usage

Instantiate the class with `{options}`, manipulate row data with `.assign(values)` or `.match(string)`, retreive `batch` object with `.batchInsert(rows)`.

```
const tables = new Tables( [
    {name:"table1", fields:[ id:"number", name:"string" ] },
    {name:"table2", fields:[ phone:/phone:(\d+)/, version:1 ] }
    ] );
const fields = tables.fields( )
//  [ table1:{ id : number, name: string },
      table2:{ phone: number, version: number }
    ]
const row = table.row( )
//  [
      table1:{ id : undefined, name : undefined }
      table2:{ phone : undefined, version : 1 }
const row = table.assign( [ 1, "John" ] );
      table1:{ id : 1, name : "John" }
      table2:{ phone : undefined, version : 1 }
const row = table.match( "name:John phone:112" );
      table1:{ id : 1, name : "John" }
      table2:{ phone : 112, version : 1 }
const batch = table.batchInsert( [
        table1:[ {id:1,name:"John"}, {id:2,name:"Peter"} ],
        table2:[ {phone:112,version:1},{phone:000,version:1} ]
 ] )
//  [ table1:{ sql : "insert into table1 (id,name) values(:id,:name);",
      rows : [ {id:1,name:"John"},{id:2,name:"Peter"} ]
    },
      table2:{ sql : "insert into table2 (phone,version) values(:phone,:veersion);",
      rows : [ {phone:112,version:1},{phone:000,version:1} ]
    }
]
```

#### Options

Object with following properties:

- `tables` - array of `Table` definitions.

#### Methods

Following methods are available:

- `.fields()` -
- `.row()` -
- `.assign(values)` -
- `.match(string)` -
- `.batchInsert(rows)` -
