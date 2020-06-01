# Transform

#### Transform

#### TransformParser

#### BatchInsert

#### BufferedBatchInsert

## Transform

`stream.Transform` class extension, where all functionality must be defined in the `transform` and `flush` functions (similar to `stream.Transform`).

#### Usage

Instantiate the class with `{options}` and pipe from _readable_ stream and pipe to _writable_ stream.

```
const transform = new Transform( options );
readable.pipe( transform ).pipe( writable );
```

#### Options

Object with following properties (similar to `stream.Readable`):

- `transform` - see `stream.Transform`
- `final` _(optional)_ - see `stream.Transform`

```
{
    transform : ( chunk, encoding, callback ) => {
        this.push( JSON.stringify( chunk ) );
        callback( );
    }
}
```

#### Returns

Returns a promise, that resolves when the writable stream ends (i.e. `.end( )`) or rejects when the writable stream throw an error.

#### Emits events

In addition to `stream.Transform` class status, one more event is present

- `success()`- when the writable stream ends.
- `failure (error)` - when the writable stream thows an error.

#### Methods

- `push(data)` - writes `string` or `object` (depending on `objectMode`). See `stream.Transform`
- `pipe(writable,options)` - pipe stream to writable stream. See `stream.Transform`

#### Status

- `source` - the class name
- `state` - the state/result of the stream. Either `pending` or `failure` or `success`.
- `error` - In case of a failure, the `error` is in status as well.
- `duration` - number of miliseconds necessary to perform the operation.

## TransformParser

`Transform` class extension, where the tranformation is handled by `Parser` object.

#### Usage

Instantiate the `Parser` object and class with `{options}` and pipe from _readable_ stream and pipe to _writable_ stream.

```
const transform = new Transform( {parser : new Parser( { options } ) } );
readable.pipe( transform ).pipe( writable );
```

#### Options

Object with following properties (similar to `stream.Transform`):

- `parser` - see `Parser` object
- `highWaterMark` _(optional)_ - 2048 by default.
- `defaultEncoding` _(optional)_ - `utf8` by default.
- `decodeStrings` _(optional)_ - `false` by default.
- `objectMode` _(optional)_ - `true` by default.
- `writableObjectMode` _(optional)_ - `false` by default.

#### Status

In addition to `Transform` class status, one more variable is present

- `inBytes` - number of bytes read
- `inLines` - number of lines read
- `outObjects` - number of objects written

## BatchInsert

`ParserTransform` class extension, where the tranformed rows are converted to `batch` objects suitable for SQL batch inserts.

#### Usage

Instantiate the `Table` and `Parser` object and class with `{options}` and pipe from _readable_ stream and pipe to SQL _writable_ stream.

```
const transform = new Transform( {tables : new Tables( { options } ) } );
readable.pipe( transform ).pipe( writable );
```

#### Options

Object with following properties (similar to `stream.Transform`):

- `tables` - see `Tables` object

#### Status

In addition to `ParserTransform` class status, one more variable is present

- `tables` - number of tables written to the database

## BufferedBatchInsert

`BatchInsert` class extension, where the `batch` objects are buffered first, and only on `limit` or stream end streamed for SQL batch inserts.

#### Usage

Instantiate the `Table` and `Parser` object and class with `{options}` and pipe from _readable_ stream and pipe to SQL _writable_ stream.

```
const transform = new Transform( { tables : new Tables( { options }, limit: 100 ) } );
readable.pipe( transform ).pipe( writable );
```

#### Options

Object with following properties (similar to `stream.Transform`):

- `tables` - see `Tables` object
- `limit` - how many rows to budder before streamed to _writable_ object

#### Status

In addition to `ParserTransform` class status, one more variable is present

- `tables` - number of tables written to the database
- `outBuffers` - number of buffers used
