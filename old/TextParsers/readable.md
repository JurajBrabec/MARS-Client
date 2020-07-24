# Readable

#### Readable

#### File

#### Process

#### SQL

## Readable

`Event` class extension with stream functionality, where all functionality must be defined in the `read` and `destroy` functions (similar to `stream.Readable`).  
As it is meant to handle large data, there is no `result` at the end or in the `status`, data must be processed in chunks or piped to a _writable_ stream.

#### Usage

First, instantiate the class with `{options}` and call `.execute([args])` method with an optional `args` parameter.  
Then handle the returning promise:

```
new Readable( options )
    .on( "data", data=> //handle data)
    .execute( [ args ] )
        .then( () => { //handle success } )
        .catch( error => { //handle error  } );
```

or asynchronously using _await_:

```
try {
    const result = await new Readable( options )
        .on("data" data => //handle data )
        .execute( [ args ] );
    // handle result
} catch( error ) {
    //handle error
}
```

or by piping to a _readable stream_:

```
new Readable( options )
    .pipe( stream )
    .execute( [ args ] )
```

#### Options

Object with following properties (similar to `stream.Readable`):

- `read` - see `stream.Readable`
- `destroy` _(optional)_ - see `stream.Readable`
- `objectMode` _(optional)_ - `false` or `true`.

```
{
    read : ( ) => {
        this.push( "test" );
        this.push( null );
    }
}
```

#### Returns

The `.execute([args])` method returns a promise, that resolves when the readable stream ends (i.e. `.push(null)`) or rejects when the readable stream throw an error.

#### Emits events

In addition to `Emitter` class status, one more event is present

- `close()` - once the underlaying stream is closed.
- `data(chunk)` - whenever there is data available from the underlaying stream.

#### Methods

- `execute([args])` - main method for executing the command
- `push(data)` - writes `string` or `object` (depending on `objectMode`). Push `null` to end the stream. See `stream.Readable`
- `pipe(writable,options)` - pipe stream to writable stream. See `stream.Readable`

#### Status

In addition to `Emitter` class status, following variables are present

- `bytes` - number of bytes read (if the `eventMode` in _options_ is `false`)
- `lines` - number of lines read (if the `eventMode` in _options_ is `false`)
- `objects` - number of objects read (if the `eventMode` in _options_ is `true`)
- `pipe` - contains the status of the piped _writable_ object (if piped)

## File

`Readble` class extension, that reads a given text `file` and streams its contents.

#### Options

Object with a following properties: (similar to `fs.readFile`)

- `path` - points to a text file
- `objectMode` _(optional)_ - `false` (default) or `true`.
- `encoding` _(optional)_ - `utf8` by default.

```
{
    path : /a/fileName
}
```

## Process

`File` class extension, that executes a given `process` with `args` and streams its output.

#### Options

Object with following properties (similar to `child.execFile`):

- `file` - points to an executable file
- `args` _(optional)_ - array of arguments
- `encoding` _(optional)_ - `utf8` by default.
- `objectMode` _(optional)_ - `false` (default) or `true`.

```
{
    file : /a/executableName
    args: [ arg1, arg2 ]
}
```

#### Status

In addition to `File` class status, one more variable is present

- `code` - exit code of the process

## Sql

`Readable` class extension, that executes a given `sql` command in MariaDB `database` and streams the rows returned.

#### Options

Object with following properties:

- `database` - points to a MariaDB database object
- `sql` - a SELECT command that reads data (uses `database.query`).

```
{
    database : new MariaDB(params)
    sql: "select * form customers;"
}
```

#### Status

In addition to `Readable` class status, one more variable is present

- `rows` - number of rows retrieved from the database
