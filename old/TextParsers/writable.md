# Writable

#### Writable

#### File

#### SQL

## Writable

`stream.Writable` class extension, where all functionality must be defined in the `write`, `final` and `destroy` functions (similar to `stream.Writable`).

#### Usage

Instantiate the class with `{options}` and write data with `.write(data)` method or pipe from _readable_ stream. End with `.end([data])` method.

```
const writable = new Writable( options );
writable.write( "test" );
writable.end( );
```

or by piping from a _readable stream_:

```
const writable = new Writable( options );
readable.pipe( writable.end );
```

#### Options

Object with following properties (similar to `stream.Writable`):

- `write` - see `stream.Writable`
- `destroy` _(optional)_ - see `stream.Writable`
- `final` _(optional)_ - see `stream.Writable`
- `objectMode` _(optional)_ - `false` or `true`.

```
{
    write : ( ) => {
        this.write( "test" );
        this.end( );
    }
}
```

#### Returns

Returns a promise, that resolves when the writable stream ends (i.e. `.end( )`) or rejects when the writable stream throw an error.

#### Emits events

In addition to `stream.Writable` class status, one more event is present

- `success()`- when the writable stream ends.
- `failure (error)` - when the writable stream thows an error.

#### Methods

- `write(data)` - writes `string` or `object` (depending on `objectMode`). See `stream.Writable`
- `end([data])` - ends the stream and writes `string` or `object` (depending on `objectMode`). See `stream.Writable`

#### Status

- `source` - the class name
- `state` - the state/result of the stream. Either `pending` or `failure` or `success`.
- `error` - In case of a failure, the `error` is in status as well.
- `duration` - number of miliseconds necessary to perform the operation.
- `bytes` - number of bytes written (if the `eventMode` in _options_ is `false`)
- `lines` - number of lines written (if the `eventMode` in _options_ is `false`)
- `objects` - number of objects written (if the `eventMode` in _options_ is `true`)

## File

`Writable` class extension, that streams data to a text `file`.

#### Options

Object with a following properties: (similar to `fs.readFile`)

- `path` - points to a text file
- `objectMode` _(optional)_ - `false` (default) or `true`.
- `decodeStrings` _(optional)_ - `false` by default.
- `defaultEncoding` _(optional)_ - `utf8` by default.

```
{
    path : /a/fileName
}
```

## Sql

`Writable` class extension, that executes a given `sql` command in MariaDB `database` and streams data to it.

#### Options

Object with following properties:

- `database` - points to a MariaDB database object
- `sql` - a SELECT command that reads data (uses `database.batch`).
- `objectMode` _(optional)_ - `false` or `true` (default).
- `defaultEncoding` _(optional)_ - `utf8` by default.
- `highWaterMark` _(optional)_ - 2048 by default.

```
{
    database : new MariaDB(params)
    sql: "insert into customers (name,address) values(:name,:address);"
}
```

#### Status

In addition to `Readable` class status, one more variable is present

- `rows` - number of rows written to the database
- `sqls` - number of SQL's executed in the database
- `warnings` - number of warnings received from the database
- `duration` - number of miliseconds that the query ran
